console.log("Hello World!");
const myCoin = {
  name: 'Ergo',
  symbol: 'ERG',
  algorithm: 'blake',
  reward: 'POW',
  /* Magic value only required for setting up p2p block notifications. It is found in the daemon
     source code as the pchMessageStart variable.
     For example, litecoin mainnet magic: http://git.io/Bi8YFw
     And for litecoin testnet magic: http://git.io/NXBYJA */
  peerMagic: 'fbc0b6db', //optional
  peerMagicTestnet: 'fcc1b7dc', //optional
};

const pool = Stratum.createPool(
  {
    coin: myCoin,
    extraNonce1Size: 1,

    address: '9fEgK6oqrZ9NwMUZAh8c3ZXqWmnrmvYg6LDgsH87ZC1MuyMfGwV', //Address to where block rewards are given

    /* Block rewards go to the configured pool wallet address to later be paid out to miners,
     except for a percentage that can go to, for examples, pool operator(s) as pool fees or
     or to donations address. Addresses or hashed public keys can be used. Here is an example
     of rewards going to the main pool op, a pool co-owner, and NOMP donation. */
    rewardRecipients: {
      /* 0.1% donation to NOMP. This pubkey can accept any type of coin, please leave this in
       your config to help support NOMP development. */
      '22851477d63a085dbc2398c8430af1c09e7343f6': 0.0001,
      // '9hU3JAP8xAhZUamAUoSa81BoVScVvBSmFf7GrzG7pevJDoQCKUh': 1.5 //DEV POOL FEE
    },

    blockRefreshInterval: 1000, //How often to poll RPC daemons for new blocks, in milliseconds

    /* Some miner apps will consider the pool dead/offline if it doesn't receive anything new jobs
     for around a minute, so every time we broadcast jobs, set a timeout to rebroadcast
     in this many seconds unless we find a new job. Set to zero or remove to disable this. */
    jobRebroadcastTimeout: 360,

    //instanceId: 37, //Recommend not using this because a crypto-random one will be generated

    /* Some attackers will create thousands of workers that use up all available socket connections,
     usually the workers are zombies and don't submit shares after connecting. This features
     detects those and disconnects them. */
    connectionTimeout: 600, //Remove workers that haven't been in contact for this many seconds

    /* Sometimes you want the block hashes even for shares that aren't block candidates. */
    emitInvalidBlockHashes: false,

    /* Enable for client IP addresses to be detected when using a load balancer with TCP proxy
     protocol enabled, such as HAProxy with 'send-proxy' param:
     http://haproxy.1wt.eu/download/1.5/doc/configuration.txt */
    tcpProxyProtocol: false,

    /* If a worker is submitting a high threshold of invalid shares we can temporarily ban their IP
     to reduce system/network load. Also useful to fight against flooding attacks. If running
     behind something like HAProxy be sure to enable 'tcpProxyProtocol', otherwise you'll end up
     banning your own IP address (and therefore all workers). */
    banning: {
      enabled: true,
      time: 600, //How many seconds to ban worker for
      invalidPercent: 50, //What percent of invalid shares triggers ban
      checkThreshold: 500, //Check invalid percent when this many shares have been submitted
      purgeInterval: 300, //Every this many seconds clear out the list of old bans
    },

    /* Each pool can have as many ports for your miners to connect to as you wish. Each port can
     be configured to use its own pool difficulty and variable difficulty settings. varDiff is
     optional and will only be used for the ports you configure it for. */
    ports: {
      3259: {
        //A port for your miners to connect to
        diff: 151400,
        multiplyDifficulty: true,
        /* Variable difficulty is a feature that will automatically adjust difficulty for
         individual miners based on their hashrate in order to lower networking overhead */
        varDiff: {
          minDiff: 302800, //Minimum difficulty
          maxDiff: 16431, //Network difficulty will be used if it is lower than this
          targetTime: 20, //Try to get 1 share per this many seconds
          retargetTime: 10, //Check to see if we should retarget every this many seconds
          variancePercent: 30, //Allow time to very this % from target without retargeting
        },
      },
      3250: {
        //Another port for your miners to connect to, this port does not use varDiff
        diff: 256, //The pool difficulty
      },
    },

    /* Recommended to have at least two daemon instances running in case one drops out-of-sync
     or offline. For redundancy, all instances will be polled for block/transaction updates
     and be used for submitting blocks. Creating a backup daemon involves spawning a daemon
     using the "-datadir=/backup" argument which creates a new daemon instance with it's own
     RPC config. For more info on this see:
        - https://en.bitcoin.it/wiki/Data_directory
        - https://en.bitcoin.it/wiki/Running_bitcoind */
    daemons: [
      {
        //Main daemon instance
        host: '192.168.1.205',
        port: 9053,
        // user: 'litecoinrpc',
        // password: 'testnet',
      },
    ],

    /* This allows the pool to connect to the daemon as a node peer to receive block updates.
     It may be the most efficient way to get block updates (faster than polling, less
     intensive than blocknotify script). It requires the additional field "peerMagic" in
     the coin config. */
    p2p: {
      enabled: false,

      /* Host for daemon */
      host: '127.0.0.1',

      /* Port configured for daemon (this is the actual peer port not RPC port) */
      port: 19333,

      /* If your coin daemon is new enough (i.e. not a shitcoin) then it will support a p2p
       feature that prevents the daemon from spamming our peer node with unnecessary
       transaction data. Assume its supported but if you have problems try disabling it. */
      disableTransactions: true,
    },
  },
  function (ip, port, workerName, password, callback) {
    //stratum authorization function
    console.log('Authorize ' + workerName + ':' + password + '@' + ip)
    callback({
      error: null,
      authorized: true,
      disconnect: false,
    })
  }
);

pool.on('share', function(isValidShare, isValidBlock, data){

  var logSystem = 'Pool';
  var logComponent = 'ERGO';
  var logSubCat = 'Thread ' + (parseInt('12') + 1);
  var shareData = JSON.stringify(data);

  if (data.blockHash && !isValidBlock)
    logger.debug(logSystem, logComponent, logSubCat, 'We thought a block was found but it was rejected by the daemon, share data: ' + shareData);

  else if (isValidBlock) {


    // const clientTwillio = new twilio('ACc5cff192f0d09e9ce53fcdf66ab2430d', 'f399da9003a811224175785ec0575328');

    // clientTwillio.messages
    //     .create({
    //         body: `Block found: ${data.blockHash} by ${data.worker}`,
    //         to: '+351912415609', // Text this number
    //         from: '+17406776800', // From a valid Twilio number
    //     })
    //     .then((message) => console.log(message.sid));
    logger.debug(logSystem, logComponent, logSubCat, 'Block found: ' + data.blockHash + ' by ' + data.worker);
  }
  if (isValidShare) {
    if(data.shareDiff > 1000000000)
      logger.debug(logSystem, logComponent, logSubCat, 'Share was found with diff higher than 1.000.000.000!');
    else if(data.shareDiff > 1000000)
      logger.debug(logSystem, logComponent, logSubCat, 'Share was found with diff higher than 1.000.000!');
    logger.debug(logSystem, logComponent, logSubCat, 'Share accepted at diff ' + data.difficulty + '/' + data.shareDiff + ' by ' + data.worker + ' [' + data.ip + ']' );

  } else if (!isValidShare) {
    logger.debug(logSystem, logComponent, logSubCat, 'Share rejected: ' + shareData);

  }
  var connection = redis.createClient(6379, '127.0.0.1');
  var coin = 'ergo';
  var redisCommands = [];

  if (isValidShare){
    redisCommands.push(['hincrbyfloat', coin + ':shares:roundCurrent', shareData.worker, shareData.difficulty]);
    redisCommands.push(['hincrby', coin + ':stats', 'validShares', 1]);
  }
  else{
    redisCommands.push(['hincrby', coin + ':stats', 'invalidShares', 1]);
  }
  /* Stores share diff, worker, and unique value with a score that is the timestamp. Unique value ensures it
     doesn't overwrite an existing entry, and timestamp as score lets us query shares from last X minutes to
     generate hashrate for each worker and pool. */
  var dateNow = Date.now();
  var hashrateData = [ isValidShare ? shareData.difficulty : -shareData.difficulty, shareData.worker, dateNow];
  redisCommands.push(['zadd', coin + ':hashrate', dateNow / 1000 | 0, hashrateData.join(':')]);

  if (isValidBlock){
    redisCommands.push(['rename', coin + ':shares:roundCurrent', coin + ':shares:round' + shareData.height]);
    redisCommands.push(['sadd', coin + ':blocksPending', [shareData.blockHash, shareData.txHash, shareData.height].join(':')]);
    redisCommands.push(['hincrby', coin + ':stats', 'validBlocks', 1]);
  }
  else if (shareData.blockHash){
    redisCommands.push(['hincrby', coin + ':stats', 'invalidBlocks', 1]);
  }

  connection.multi(redisCommands).exec(function(err, replies){
    if (err)
      logger.error(logSystem, logComponent, logSubCat, 'Error with share processor multi ' + JSON.stringify(err));
  });

})

pool.on('log', function (severity, logKey, logText) {
  var logSystem = 'Pool';
  var logComponent = 'ERGO';
  var logSubCat = 'Thread ' + (parseInt('12') + 1);
  const logger = new PoolLogger({
    "logLevel": 1
  });
  logger.debug(logSystem, logComponent, logSubCat, severity + ': ' + '[' + logKey + '] ' )
})

let startWithWallet = new Promise((resolve , reject) => {
  resolve(pool.start())
  reject(null)
})
startWithWallet.then( _ => {

})
