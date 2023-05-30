import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "src/declarations/file_manager";
import { AssetWithId, NestedAssets, Permission, _SERVICE } from "src/declarations/file_manager/file_manager.did";

let host = "http://localhost:8080";
host = "https://icp0.io";

// local
let canisterId = "rwlgt-iiaaa-aaaaa-aaaaa-cai";

// live
// canisterId = "3gjaf-uyaaa-aaaal-qbxdq-cai";

// certified assets
// canisterId = "6nrm6-2yaaa-aaaag-abklq-cai";

canisterId = "yljmk-oqaaa-aaaal-qb4yq-cai"; // ttr docs

export default abstract class Methods {
  static async actor(): Promise<_SERVICE> {
    const authClient = await AuthClient.create();

    return createActor(canisterId as string, {
      agentOptions: { host, identity: authClient.getIdentity() },
    });
  }

  static async addAssets(parentId: [] | [bigint], assets: NestedAssets[]) {
    const actor = await this.actor();
    const result = await actor.add_assets(parentId, assets);
    return await this.unwrapResult(result);
  }

  static async addChunks(data: [bigint, number[]][]) {
    const actor = await this.actor();
    return await actor.add_chunks(data);
  }

  static async getAssetTree(parentId: [] | [bigint], ownerOnly: boolean) {
    const actor = await this.actor();
    return await actor.get_assets_tree(parentId, ownerOnly);
  }

  static async deleteAsset(asset: AssetWithId) {
    const actor = await this.actor();
    const result = await actor.delete_asset(asset);
    return await this.unwrapResult(result);
  }

  static async createDirectory(name: string, parentId: [] | [bigint]) {
    const actor = await this.actor();
    const result = await actor.create_directory(name, { Public: null }, parentId);
    return await this.unwrapResult(result);
  }

  static async changeAssetName(name: string, asset: AssetWithId) {
    const actor = await this.actor();
    const result = await actor.change_asset_name(name, asset);
    return await this.unwrapResult(result);
  }

  static async changeAssetPermission(permission: Permission, asset: AssetWithId) {
    const actor = await this.actor();
    const result = await actor.change_asset_permission(permission, asset);
    return await this.unwrapResult(result);
  }

  static async getMetadata() {
    const actor = await this.actor();
    return await actor.get_metadata();
  }

  static unwrapResult = <T, E>(result: { Ok: T } | { Err: E }): Promise<T> => {
    return new Promise((resolve: (value: T) => void, reject: (error: E) => void) => {
      if ("Ok" in result) {
        return resolve(result.Ok);
      } else {
        return reject(result.Err);
      }
    });
  };
}
