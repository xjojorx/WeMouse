use anyhow::Result;
use clap::Parser;
use std::net::IpAddr;
use std::str::FromStr;
use futures_util::{SinkExt, StreamExt};
use rust_embed::RustEmbed;
use warp::{Filter, Reply, http::Response, http::StatusCode};
use rustautogui::{self, RustAutoGui};

// Embed the entire static directory
#[derive(RustEmbed)]
#[folder = "static/"]
struct StaticFiles;

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Args {
    /// Host address to bind to
    #[clap(short = 'H', long = "host", default_value = "127.0.0.1")]
    host: String,

    /// Port to listen on
    #[clap(short = 'p', long = "port", default_value_t = 8080)]
    port: u16,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Parse command-line arguments
    let args = Args::parse();
    
    // Parse the IP address
    let ip_addr = match IpAddr::from_str(&args.host) {
        Ok(ip) => ip,
        Err(e) => {
            eprintln!("Invalid IP address: {}", e);
            eprintln!("Using default: 127.0.0.1");
            IpAddr::from_str("127.0.0.1").unwrap()
        }
    };

    //routes
    let ws_route = warp::path("ws")
        .and(warp::ws())
        .map(|ws: warp::ws::Ws| {
            ws.on_upgrade(|websocket| handle_websocket_connection(websocket))
        });

    let static_route = warp::path::full()
        .and(warp::get())
        .map(|path: warp::path::FullPath| {
            let path_str = path.as_str();
            let file_path = path_str.trim_start_matches('/');
            serve_embedded_file(file_path)
        });

    let root_route = warp::path::end()
        .map(|| serve_embedded_file("index.html"));

    let routes = ws_route.or(root_route).or(static_route);
    // let addr = ([0,0,0,0], 8080);
    let addr = (ip_addr, args.port);

    print!("Server start on: ");
    let addr_text = format_addr(ip_addr, args.port);
    print_clickable_url(&addr_text, Some(&addr_text));
    warp::serve(routes).run(addr).await;



    Ok(())
}
fn print_clickable_url(url: &str, text: Option<&str>) {
    // The display text defaults to the URL if not provided
    let display_text = text.unwrap_or(url);
    
    // OSC 8 escape sequence format for hyperlinks
    // \x1B]8;;URL\x07TEXT\x1B]8;;\x07
    println!("\x1B]8;;{}\x07{}\x1B]8;;\x07", url, display_text);
}
fn format_addr(host: IpAddr, port: u16) -> String {
    format!("{}:{}", host, port)
}

async fn handle_websocket_connection(websocket: warp::ws::WebSocket) {
    let rustautogui = rustautogui::RustAutoGui::new(false).unwrap(); // arg: debug
    // Handle the WebSocket connection
    println!("WebSocket connection established");
    let (mut tx, mut rx) = websocket.split();

    // Echo all messages back
    while let Some(result) = rx.next().await {
        match result {
            Ok(msg) => {
                if msg.is_close() {
                    break;
                }
                if msg.is_text() {
                    let received_text = msg.to_str().unwrap_or("").to_string();
                    // println!("Received message: {}", received_text);
                    let res = process_message(&received_text, &rustautogui);
                    // println!("{}",msg_count);
                    // msg_count += 1;
                    let response = match res {
                        Ok(m) => m,
                        Err(m) => m
                    };
                    if let Err(e) = tx.send(warp::ws::Message::text(response)).await {
                        eprintln!("WebSocket send error: {}", e);
                        break;
                    }
                }
            }
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
        }
    }
    println!("WebSocket connection closed");
}


#[derive(Debug)]
enum Command {
    Echo(String),
    Close(),
    Move{x: i32, y: i32},
}

fn parse_command(input:&str) -> Result<Command, String> {
    if input == "CLOSE" {
        return Ok(Command::Close())
    } 
    if input.starts_with("ECHO:") {
        // println!("echooooo");
        return Ok(Command::Echo(input[5..].to_string()))
    }

    if input.starts_with("MOVE:") {
        let coords: Vec<i32> = input[5..]
            .split(";")
            .take(2)
            .map(|s|  s.parse::<i32>())
            .map(|n| n.unwrap_or(0))
            .collect()
        ;

        return Ok(Command::Move{x :coords[0], y :coords[1]})
    }

    Err("unknown command".to_string())
}

fn process_message(input: &String, rustautogui: &RustAutoGui) -> Result<String, String> {
    match parse_command(input) {
        Err(s) => Err(s),
        Ok(cmd) => process_command(cmd, rustautogui)
    }
}

fn process_command(cmd: Command, rustautogui: &RustAutoGui) -> Result<String, String> {
    match cmd {
        Command::Close() => Ok("BYE".to_string()),
        Command::Echo(content) => Ok(content),
        Command::Move { x, y } => process_move(x,y, rustautogui)
    }
}


fn process_move(x: i32, y: i32, rustautogui: &RustAutoGui) -> std::result::Result<String, String> {
    // println!("x: {}, y: {}", x, y);

    let (pre_x, pre_y) = rustautogui.get_mouse_position().unwrap();

    let dest_x :u32 = u32::try_from(pre_x+x).unwrap_or(0);
    let dest_y :u32 = u32::try_from(pre_y + y).unwrap_or(0);
    // println!("prex: {}, prey: {}, destx: {}, desty: {}, x: {}, y: {}", pre_x, pre_y, dest_x, dest_y, x, y);

    _ = rustautogui.move_mouse_to_pos(dest_x, dest_y, 0.0);

    return Ok("moved!".to_string());
}


fn serve_embedded_file(path: &str) -> impl Reply {
    match StaticFiles::get(path) {
        Some(content) => {
            // Guess the MIME type based on the file extension
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            
            Response::builder()
                .header("content-type", mime.as_ref())
                .body(content.data.to_vec())
                .unwrap()
        },
        None => {
            // If file not found, try to serve index.html for SPA routing
            if path != "index.html" && path != "" && StaticFiles::get("index.html").is_some() {
                // For SPA routing, return index.html for non-existent paths
                let content = StaticFiles::get("index.html").unwrap();
                Response::builder()
                    .header("content-type", "text/html")
                    .body(content.data.to_vec())
                    .unwrap()
            } else {
                Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .body(Vec::from("File not found"))
                    .unwrap()
            }
        }
    }
}
