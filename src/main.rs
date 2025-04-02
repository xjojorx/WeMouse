use std::error::Error;

use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::protocol::Message;
use anyhow::Result;
use futures_util::{SinkExt, StreamExt};



#[tokio::main]
async fn main() -> Result<()> {
    let addr = "0.0.0.0:8080".to_string();
    let listener = TcpListener::bind(&addr).await?;
    println!("WebSocket server started on ws://{}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        tokio::spawn(handle_connection(stream));
    }

    Ok(())
}

async fn handle_connection(stream: tokio::net::TcpStream) -> Result<()> {
    let mut ws = accept_async(stream).await?;
    while let Some(n) = ws.next().await {
        match n {
            Err(_) => break,
            Ok(msg) => {
                if msg.is_text() {
                    let received_text = msg.to_string();
                    println!("Received message: {}", received_text);
                    let res = process_message(&received_text);
                    let response = match res {
                        Ok(m) => m,
                        Err(m) => m
                    };
                    ws.send(Message::Text(response)).await?;
                }
            },
        }
    }

    Ok(())
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
        println!("echooooo");
        return Ok(Command::Echo(input[5..].to_string()))
    }

    if input.starts_with("MOVE:") {
        let coords: Vec<i32> = input[5..]
            .split(";")
            .take(2)
            .map(|s| s.parse::<i32>())
            .map(|n| n.unwrap_or(0))
            .collect()
        ;

        return Ok(Command::Move{x :coords[0], y :coords[1]})
    }

    Err("unknown command".to_string())
}

fn process_message(input: &String) -> Result<String, String> {
    match parse_command(input) {
        Err(s) => Err(s),
        Ok(cmd) => process_command(cmd)
    }
}

fn process_command(cmd: Command) -> Result<String, String> {
    match cmd {
        Command::Close() => Ok("BYE".to_string()),
        Command::Echo(content) => Ok(content),
        Command::Move { x, y } => process_move(x,y)
    }
}

fn process_move(x: i32, y: i32) -> std::result::Result<String, String> {
    println!("x: {}, y: {}", x, y);
    return Ok("sdf".to_string());
}
