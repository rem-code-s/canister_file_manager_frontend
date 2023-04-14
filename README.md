###

<img src="https://3gjaf-uyaaa-aaaal-qbxdq-cai.raw.ic0.app/static/media/logo_large.1eb5ead8b26a8ad5e527.png"
     alt="Served from the canister"
     style="margin-top: 20px; height: 48px; filter: drop-shadow(1px 1px 25px black)" />

##

# Canister file manager frontend

This is a CRA app that is created to demo the possibilities of the [backend](https://github.com/rem-code-s/canister_file_manager_backend) canister.

This [canister](https://3gjaf-uyaaa-aaaal-qbxdq-cai.raw.ic0.app/) serves as an example of this code.

---

### local deployment

To setup the demo application you need to deploy the backend canister and upload the frontend files to it from a local devserver.

#### backend

- navigate to the backend folder with a CLI
- run `dfx start --clean --background`
- run `dfx deploy --no-wallet`
- Take note of the `canisterId` that is used

#### frontend

- navigate to the frontend folder with a CLI / open in code editor
- run `npm install`
- Change the `canisterId` and `host` accordingly in `src/api/Methods.ts` (yes yes, i should have handled it better)
- build the project `npm run build`
- start the local server `npm run start`
- open the browser on `http://localhost:3000`
- upload the files from the `build` folder and the `static` directory.
- if that is done visit `http://rwlgt-iiaaa-aaaaa-aaaaa-cai.localhost:8080/` (canister id could be different if you have other canisters running locally)
- Frontend should be running on the canister
