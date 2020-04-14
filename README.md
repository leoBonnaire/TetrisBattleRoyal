# TRETIS

Tretis is an online-based modified version of the well-known Tetris game

## Requirements

You only need to have `Node.js` installed on your computer.

You can download it from the official website at [nodejs.org](https://nodejs.org/)

## Make the Tretis server run on your computer

### Configuration

Change the IP in `serverSettings.js` to yours (go to [MyIp](https://www.myip.com/) to see what is yours).

You can also change the port for the server but we recommand you to keep the port 3000 as default.


Now you need to open the port (3000 as default) on your router to let everyone connect to your server.

### Windows

Just run `run.bat`.

(The logs are automatically stored in log.txt)

### Linux

In a shell, run the command :

```bash
node server.js
```

If you want the logs to be stored in the log.txt file, just add this to the previous command :

```bash
node server.js | tee log.txt
```

## It's now time to play !

Go to your browser and type your IP, then ":" and finally the port you set (3000 as default).

Example : If your IP is 79.92.163.180, you have to go to `89.91.162.180:3000`


Now everyone around the world is able to access your server by typing the same thing is their browser (with you IP).
