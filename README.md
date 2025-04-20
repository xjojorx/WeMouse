# WeMouse

WeMouse is a web-based remote controller for a PC.

Windows, Linux and MacOS are supported.

## Usage

### Running the server

Run the server on any IP:

``` bash
wemouse -H 0.0.0.0
```

It is possible to use a specific IP address by changing the supplied IP on the `-H` flag, for example `wemouse -H 192.168.1.133`

### Accessing the UI

Once the server is running, the UI can be accessed on the host's IP, by default on port `8080`.
For example:

```
http://192.168.1.133:8080
```


> [!WARNING]
> DO NOT EVER EXPOSE THIS TO THE OPEN INTERNET. There is no additional security and bad actors who find your address could control your computer, even if they're not directly seeing the effects on screen


## Installation

WeMouse is distributed as a single file executable.

### Binary releases

You can download a binary release from GitHub [here](../../releases).

### Building from source

#### With the provided script

The repository includes a script to do the whole build. The result will be at `target/release/wemouse`

```
./build.sh
```
This script depends on cargo and pnpm. If you prefer to use another js package manager, you can replace it over at `build_front.sh`. Just replace the pnpm calls to the equivalent call.

#### Manual approach (useful for development)

To build the project there are 2 steps. First the fronted has to be built into static files. Then the server can just embed those files into it's binary in order to serve them.

##### Build the client

This can also be done by the `build_front.sh` script.

First build the client itself by running the following commands on the `client/solidclient` directory:
```bash
# pnpm can be replaced by npm or other js packagin solutions
pnpm i
pnpm run build
```

Then copy the built result into the `static` directory on the project's root:

``` bash
cp ./client/solidclient/dist/index.html ./static/index.html
cp ./client/solidclient/dist/assets/*.js ./static/index.js
cp ./client/solidclient/dist/assets/*.css ./static/index.css

```

The built client files include some unique identifiers for the assets, this should be stripped because we renamed them to `index.js` and `index.css` on the copy step. 

It can be done manually or by a single sed call:

``` bash
sed -i'' -e 's/\/assets\/index-[^.]*\./\/index./g' ./static/index.html
```

Finally, to build the final executable, run `cargo`:

```bash
cargo build --release
```


## Dependencies

Linux users may need to install `libxdo-dev` for X11 support. Check out [enigo](https://github.com/enigo-rs/enigo?tab=readme-ov-file#runtime-dependencies) for more information:


Debian-based distros:
```bash
apt install libxdo-dev
```

Arch Linux:
```bash
pacman -S xdotool
```



## Contributing

Feel free to contribute any proposed changes with a pull request.

If you feel like something is missing or found a bug, please report it on a GitHub Issue

## License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](LICENSE) file for details.
