const mergeMiddleware = require('json-rpc-engine/src/mergeMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const createBlockReRefMiddleware = require('eth-json-rpc-middleware/block-ref')
const createRetryOnEmptyMiddleware = require('eth-json-rpc-middleware/retryOnEmpty')
const createBlockCacheMiddleware = require('eth-json-rpc-middleware/block-cache')
const createInflightMiddleware = require('eth-json-rpc-middleware/inflight-cache')
const createBlockTrackerInspectorMiddleware = require('eth-json-rpc-middleware/block-tracker-inspector')
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware')
const createInfuraMiddleware = require('eth-json-rpc-infura')
const createBlockTracker = require('./createBlockTracker')

module.exports = createInfuraClient

function createInfuraClient ({ network, platform }) {
  const infuraMiddleware = createInfuraMiddleware({ network, maxAttempts: 5, source: 'metamask' })
  const infuraProvider = providerFromMiddleware(infuraMiddleware)
  const blockTracker = createBlockTracker({ provider: infuraProvider }, platform)

  const networkMiddleware = mergeMiddleware([
    createNetworkAndChainIdMiddleware({ network }),
    createBlockCacheMiddleware({ blockTracker }),
    createInflightMiddleware(),
    createBlockReRefMiddleware({ blockTracker, provider: infuraProvider }),
    createRetryOnEmptyMiddleware({ blockTracker, provider: infuraProvider }),
    createBlockTrackerInspectorMiddleware({ blockTracker }),
    infuraMiddleware,
  ])
  return { networkMiddleware, blockTracker }
}

function createNetworkAndChainIdMiddleware ({ network }) {
  let chainId
  let netId

  switch (network) {
    case 'mainnet':
      netId = 'pchain'
      chainId = '0x01'
      break
    case 'ropsten':
      netId = 'child_0'
      chainId = '0x03'
      break
    case 'kovan':
      netId = 'testnet'
      chainId = '0x2a'
      break
    case 'rinkeby':
      netId = 'child_0'
      chainId = '0x04'
      break
    // case 'goerli':
    //   netId = '5'
    //   chainId = '0x05'
    //   break
    default:
      throw new Error(`createInfuraClient - unknown network "${network}"`)
  }

  return createScaffoldMiddleware({
    eth_chainId: chainId,
    net_version: netId,
  })
}
