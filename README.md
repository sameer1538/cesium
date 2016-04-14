# Cesium

[Unhosted webapp](https://unhosted.org) client for [uCoin](http://ucoin.io) network.

Try it at: http://cesium.ucoin.io

## Developer

To contribute and compile cesium, you will have to: 
 
  - Installing [mvn](https://github.com/creationix/nvm)   
```
  wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
```

  - Configure NodeJS to use a version 5:
```
  nvm install 5 
```
      
  - Installing other build dependencies:
```
 sudo apt-get install build-essential
```
   
  - Getting source and installing project dependencies:    
```
  git clone https://www.github.com/ucoin-io/cesium.git
  cd cesium
  npm install
```

  - Compiling and running application   
```
  gulp & ionic serve
```

 - To build on another environment :
   - Add your environment config into `app/config.json`
   - Run compitaltion using option `--env`:
```
  gulp default --env <your_env_name> 
```