## Security

Relm uses public/private keypairs with signing to ensure that only recognized clients can connect and share data with the multiplayer server (via websocket).

There are 3 pieces involved in this process:
1. A unique player ID (UUID)
2. One-Time Use Tokens (used for inviting new people to join)
3. A public/private keypair generated on the browser (and public key shared with the server).

The basic One-Time Use flow is as follows:
- an "inviter" is someone who has already registered their public key on the server
- the inviter generates a One-Time Use token (URL with token embedded) and shares it with an invitee
- the invitee's browser generated a keypair with private key that is not shared anywhere and stores both keys in localStorage
- the invitee's browser generates a unique player UUID and stores it in localStorage
- the invitee's browser sends the following to the server:
  - the player UUID
  - the public key
  - the One-Time Use token
- the server accepts the public key (because of the token) & registers the public key as belonging to the player ID
- the invitee is now "registered"
- the server accepts the websocket connection

Thereafter, the regular login flow is as follows:
- the player ID, public key, and private key are retrieved from localStorage
- the registered player's browser signs the player ID with the private key
- the registered player sends the following to the server:
  - the player UUID
  - the signed player UUID
- the server looks up the public key based on the player ID
- the server verifies the signed player ID
- the server accepts the websocket connection
