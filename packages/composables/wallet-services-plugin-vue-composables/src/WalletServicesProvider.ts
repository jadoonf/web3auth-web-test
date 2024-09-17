import { EVM_PLUGINS, IPlugin, PLUGIN_EVENTS, WalletServicesPluginError, Web3AuthContextKey } from "@web3auth/base";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { defineComponent, h, inject, provide, Ref, ref, watch } from "vue";

import { WalletServicesContextKey } from "./context";
import { IWalletServicesContext } from "./interfaces";

interface IWeb3AuthContext {
  isInitialized: Ref<boolean>;
  getPlugin(pluginName: string): IPlugin | null;
}

export const WalletServicesProvider = defineComponent({
  name: "WalletServicesProvider",
  setup() {
    const web3AuthContext = inject<IWeb3AuthContext>(Web3AuthContextKey);
    if (!web3AuthContext) throw WalletServicesPluginError.fromCode(1000, "`WalletServicesProvider` must be wrapped by `Web3AuthProvider`");

    const { getPlugin, isInitialized } = web3AuthContext;

    const walletServicesPlugin = ref<WalletServicesPlugin | null>(null);
    const isPluginConnected = ref<boolean>(false);
    watch(isInitialized, (newIsInitialized) => {
      if (newIsInitialized) {
        const plugin = getPlugin(EVM_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
        walletServicesPlugin.value = plugin;
      }
    });

    watch(walletServicesPlugin, (newWalletServicesPlugin, prevWalletServicesPlugin) => {
      const connectedListener = () => {
        isPluginConnected.value = true;
      };

      const disconnectedListener = () => {
        isPluginConnected.value = false;
      };

      // unregister previous listeners
      if (prevWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.CONNECTED, connectedListener);
        prevWalletServicesPlugin.off(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }

      if (newWalletServicesPlugin && newWalletServicesPlugin !== prevWalletServicesPlugin) {
        newWalletServicesPlugin.on(PLUGIN_EVENTS.CONNECTED, connectedListener);
        newWalletServicesPlugin.on(PLUGIN_EVENTS.DISCONNECTED, disconnectedListener);
      }
    });

    const showWalletConnectScanner = async () => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showWalletConnectScanner();
    };

    const showWalletUI = async () => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showWalletUi();
    };

    const showCheckout = async () => {
      if (!walletServicesPlugin.value) throw WalletServicesPluginError.notInitialized();
      if (!isPluginConnected.value) throw WalletServicesPluginError.walletPluginNotConnected();

      return walletServicesPlugin.value.showCheckout();
    };

    provide<IWalletServicesContext>(WalletServicesContextKey, {
      plugin: walletServicesPlugin as Ref<WalletServicesPlugin | null>,
      isPluginConnected,
      showWalletConnectScanner,
      showCheckout,
      showWalletUI,
    });
  },
  render() {
    return h(this.$slots.default ?? "");
  },
});
