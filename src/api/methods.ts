import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "src/declarations/file_manager";
import { NestedAssets, Permission, _SERVICE } from "src/declarations/file_manager/file_manager.did";

let canisterId = "rwlgt-iiaaa-aaaaa-aaaaa-cai";
let host = "http://localhost:8080";

canisterId = "3gjaf-uyaaa-aaaal-qbxdq-cai";
host = "https://ic0.app";

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

  static async deleteDirectory(directoryId: bigint) {
    const actor = await this.actor();
    const result = await actor.delete_directory(directoryId);
    return await this.unwrapResult(result);
  }

  static async changeFilePermission(fileId: bigint, permission: Permission) {
    const actor = await this.actor();
    const result = await actor.change_file_permission(fileId, permission);
    return await this.unwrapResult(result);
  }

  static async changeDirectory(directoryId: bigint, permission: Permission) {
    const actor = await this.actor();
    const result = await actor.change_directory_permission(directoryId, permission);
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
