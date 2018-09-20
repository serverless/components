/* eslint-disable */

// ---------------------------------------------------------
// NOTE
// DON'T MODIFY THE FILES HERE!
// ALL THE CODE HERE WAS MOVED INTO THE CORE CODEBASE
// NOTE
// ---------------------------------------------------------

class Subscription extends Component {
  source: ISource
  sink: ISink
  gateway: IGateway
  config: Object

  // getters
  getSource(instance): ISource {
    return instance.source
  }
  getSink(instance): ISink {
    return instance.sink
  }
  getGateway(instance): IGateway {
    return instance.gateway
  }
  getConfig(instance): Object {
    return instance.config
  }

  async deploy(instance, context) {
    await instance.source.deploySource(instance, context)
  }
}

interface ISource {
  getSourceConfig(instance: this) {
    uri: String
  }

  async deploySource(instance: this, subscription: Subscription, context: Context): any {}
}

interface ISink {
  getSinkConfig(instance: this): {
    uri: String
    protocol: String, // TODO: revisit this --> make it generic
  }
}

interface IGateway {
  async configureGateway(instance: this, subscription: Subscription, context: Context): any {}
}
