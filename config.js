const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient()

exports.config = {}

exports.setConfig = async () => {

    try{
        const [unParsed] = await client.accessSecretVersion({name: 'projects/hse-clubs/secrets/MONGO_URI/versions/latest'})
        
        exports.config.MONGO_URI = unParsed.payload.data.toString()


    } catch(err) {
        console.log(err)
    }
}
