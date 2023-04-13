import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "src/declarations/file_hosting";
import { NestedAssets, _SERVICE } from "src/declarations/file_hosting/file_hosting.did";

// const canisterId = "rwlgt-iiaaa-aaaaa-aaaaa-cai";
// const host = "http://localhost:8080";

const canisterId = "3gjaf-uyaaa-aaaal-qbxdq-cai";
const host = "https://ic0.app";

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

  static async getAssetTree(parentId: [] | [bigint]) {
    const actor = await this.actor();
    return await actor.get_assets_tree(parentId);
  }

  static async deleteFile(parentId: bigint) {
    const actor = await this.actor();
    const result = await actor.delete_file(parentId);
    return await this.unwrapResult(result);
  }

  static async createDirectory(name: string, parentId: [] | [bigint]) {
    const actor = await this.actor();
    const result = await actor.create_directory(name, { Public: null }, parentId);
    return await this.unwrapResult(result);
  }

  static async deleteDirectory(parentId: bigint) {
    const actor = await this.actor();
    const result = await actor.delete_directory(parentId);
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
