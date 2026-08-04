import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, isConnected, signTransaction } from "@stellar/freighter-api";
import { connectWallet, signWithWallet, WalletError } from "./wallet";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));

describe("connectWallet", () => {
  beforeEach(() => {
    vi.mocked(isConnected).mockReset();
    vi.mocked(getAddress).mockReset();
  });

  it("throws WalletError when no wallet extension is installed", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false });

    await expect(connectWallet()).rejects.toThrow(WalletError);
  });

  it("throws WalletError when the address can't be read", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ error: { message: "locked" } } as never);

    await expect(connectWallet()).rejects.toThrow("locked");
  });

  it("returns the wallet address when connected and readable", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: "GABC123" } as never);

    await expect(connectWallet()).resolves.toBe("GABC123");
  });
});

describe("signWithWallet", () => {
  beforeEach(() => {
    vi.mocked(signTransaction).mockReset();
  });

  it("throws WalletError when signing is cancelled or fails", async () => {
    vi.mocked(signTransaction).mockResolvedValue({ error: { message: "User declined access" } } as never);

    await expect(signWithWallet("xdr", "GABC123")).rejects.toThrow("User declined access");
  });

  it("returns the signed XDR on success", async () => {
    vi.mocked(signTransaction).mockResolvedValue({ signedTxXdr: "signed-xdr" } as never);

    await expect(signWithWallet("xdr", "GABC123")).resolves.toBe("signed-xdr");
  });
});
