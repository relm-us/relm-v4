import stampit from 'stampit'
import { uuidv4 } from './util.js'
import * as base64 from 'base64-arraybuffer-es6'

// see https://github.com/PeculiarVentures/webcrypto-docs/blob/master/ECDSA.md
const SECURITY_CONFIG = {
  name: 'ECDSA',
  namedCurve: 'P-384',
  namedHash: 'SHA-384'
}

const Security = stampit({
  props: {
    secureId: null,
    secret: null,
    keypair: null,
  },
  
  methods: {
    /**
     * Returns the `secureId` stored in LocalStorage. If none is stored,
     * randomly generates a secureId and stores it.
     * 
     * @returns {string} secureId
     */
    async getOrCreateId() {
      if (!this.secureId) {
        this.secureId = localStorage.getItem('secureId')
        if (!this.secureId) {
          this.secureId = uuidv4()
          localStorage.setItem('secureId', this.secureId)
        }
      }
      return this.secureId
    },
    
    async getOrCreateSecret() {
      if (!this.secret) {
        const secretJson = localStorage.getItem('secret')
        if (!secretJson) {
          const pair = await window.crypto.subtle.generateKey(
            SECURITY_CONFIG,
            true, // can export
            ["sign", "verify"],
          )
          this.secret = {
            pu: await window.crypto.subtle.exportKey('jwk', pair.publicKey),
            pr: await window.crypto.subtle.exportKey('jwk', pair.privateKey)
          }
          localStorage.setItem('secret', JSON.stringify(this.secret))
        } else {
          this.secret = JSON.parse(secretJson)
        }
      }
      return this.secret
    },

    
    async getOrCreateKeyPair() {
      const secret = await this.getOrCreateSecret()
      return {
        pu: await window.crypto.subtle.importKey(
          'jwk', secret.pu,
          SECURITY_CONFIG,
          true, ['verify']
        ),
        pr: await window.crypto.subtle.importKey(
          'jwk', secret.pr,
          SECURITY_CONFIG,
          true, ['sign']
        ),
      }
    },
    
    async exportPublicKey() {
      const keypair = await this.getOrCreateKeyPair()
      return await window.crypto.subtle.exportKey('jwk', keypair.pu)
    },
    
    async publicKey() {
      return (await this.getOrCreateKeyPair()).pu
    },
    
    async privateKey() {
      return (await this.getOrCreateKeyPair()).pr
    },
    
    async sign(message) {
      const encoded = new window.TextEncoder().encode(message)
      const privateKey = await this.privateKey()
      const signatureArrayBuffer = await window.crypto.subtle.sign(
        { name: SECURITY_CONFIG.name,
          hash: {name: SECURITY_CONFIG.namedHash}},
        privateKey,
        encoded
      )
      return base64.encode(signatureArrayBuffer, 0, signatureArrayBuffer.byteLength)
    },
    
    async verify(message, signature) {
      const encoded = new window.TextEncoder().encode(message)
      const publicKey = await this.publicKey()
      const signatureArrayBuffer = base64.decode(signature)
      
      const result = await window.crypto.subtle.verify(
        { name: SECURITY_CONFIG.name,
          hash: {name: SECURITY_CONFIG.namedHash}},
        publicKey,
        signatureArrayBuffer,
        encoded
      )
      return result
    }
  }
})

export { Security }
