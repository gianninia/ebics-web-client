import { ref, watch, Ref } from 'vue';
import {
  BankConnection,
  BTFType,
  OrderTypeFilter,
  OrderType,
  OrderTypesCache,
  TransferType,
  EbicsVersion,
} from 'components/models';
import useFileTransferAPI from './filetransfer';
import { CustomMap } from './utils';
import usePasswordAPI from './password-api';
import useBanksAPI from './banks';

//Global internal cache of all BTF's and OrderTypes for all active bank connections..
const orderTypeCache: CustomMap<number, OrderTypesCache> = new CustomMap<
  number,
  OrderTypesCache
>();

export default function useOrderTypesAPI(
  selectedBankConnection: Ref<BankConnection | undefined>,
  activeBankConnections: Ref<BankConnection[] | undefined>,
  filterType: Ref<OrderTypeFilter>,
  displayAdminTypes: Ref<boolean> = ref(false),
) {
  //BTF   types of selectedBankConnection filtered by filterType
  const outputBtfTypes: Ref<BTFType[]> = ref([]);
  //Order types of selectedBankConnection filtered by filterType
  const outputOrderTypes: Ref<OrderType[]> = ref([]);

  const { ebicsOrderTypes } = useFileTransferAPI();
  const { promptCertPassword } = usePasswordAPI();
  const { isEbicsVersionAllowedForUse } = useBanksAPI(true);

  /**
   * If the @param orderTypesCache is empty or refresh is forced,
   * Then download available ordertypes from EBICS server and store them to the cache
   * @param bankConnection
   * @param orderTypesCache used to store output
   * @param forceCashRefresh force refresh even if there is already cached result
   */
  const updateOrderTypesH004CacheForBankConnection = async (
    bankConnection: BankConnection,
    orderTypesCache: OrderTypesCache,
    forceCashRefresh = false
  ) => {
    console.log(`Loading order types H004 ${JSON.stringify(bankConnection.partner.bank)}`)
    if (
      isEbicsVersionAllowedForUse(
        bankConnection.partner.bank,
        EbicsVersion.H004
      ) &&
      (orderTypesCache.orderTypes.length == 0 || forceCashRefresh)
    ) {
      const orderTypesRefreshPromise = ebicsOrderTypes(
        bankConnection,
        EbicsVersion.H004
      ) as Promise<OrderType[]>;

      orderTypesCache.orderTypes = await orderTypesRefreshPromise;

      if (bankConnection.id == selectedBankConnection.value?.id)
        refreshOutputOrderTypes(bankConnection);
    }
  };

  /**
   * If the @param orderTypesCache is empty or refresh is forced,
   * Then download available ordertypes from EBICS server
   * @param bankConnection
   * @param orderTypeList used to store output
   * @param forceCashRefresh force refresh even if there is already cached result
   */
  const updateOrderTypesH005CacheForBankConnection = async (
    bankConnection: BankConnection,
    orderTypeList: OrderTypesCache,
    forceCashRefresh = false
  ) => {
    console.log(`Loading order types H005 ${JSON.stringify(bankConnection.partner.bank)}`)
    if (
      isEbicsVersionAllowedForUse(
        bankConnection.partner.bank,
        EbicsVersion.H005
      ) &&
      (orderTypeList.btfTypes.length == 0 || forceCashRefresh)
    ) {
      const orderTypesRefreshPromise = ebicsOrderTypes(
        bankConnection,
        EbicsVersion.H005
      ) as Promise<BTFType[]>;

      orderTypeList.btfTypes = await orderTypesRefreshPromise;

      if (bankConnection.id == selectedBankConnection.value?.id)
        refreshOutputBtfTypes(bankConnection);
    }
  };

  /**
   * Refresh ordertypes & BTF types cache for given bank connection
   * @param bankConnection
   * @param forceCashRefresh force refreshing even if the cache already have the order types.
   */
  const updateOrderTypesCacheForBankConnection = async (
    bankConnection: BankConnection,
    forceCashRefresh = false
  ) => {
    //Create emtpy order type cache for this bank connection
    const orderTypesCache: OrderTypesCache = orderTypeCache.getOrAdd(
      bankConnection.id,
      { btfTypes: [], orderTypes: [] }
    );

    //For pasword protected connection ask first password
    //It prevents parallel poping of UI password dialog
    await promptCertPassword(bankConnection, false);

    //Now execute all update promisses
    //the password UI would not pop-up any more because of previous promptCertPassword
    await Promise.allSettled([
      updateOrderTypesH004CacheForBankConnection(
        bankConnection,
        orderTypesCache,
        forceCashRefresh
      ),
      updateOrderTypesH005CacheForBankConnection(
        bankConnection,
        orderTypesCache,
        forceCashRefresh
      ),
    ]);
  };

  const updateOrderTypesCacheForAllActiveConnections =
    async (): Promise<void> => {
      if (activeBankConnections.value) {
        console.log('Loading order types')
        //Collect all update ordertype promisses
        const updateOrderTypesPromisses = activeBankConnections.value.map(
          (bankConnection) =>
            updateOrderTypesCacheForBankConnection(bankConnection)
        );

        //Execute those promisses parallel
        await Promise.allSettled(updateOrderTypesPromisses);
        console.log('Order types loaded')
      }
    };

  const refreshOutputOrdertypesForSelectedBankConnection = () => {
    if (selectedBankConnection.value) {
      refreshOutputBtfTypes(selectedBankConnection.value);
      refreshOutputOrderTypes(selectedBankConnection.value);
    }
  };

  const downloadableAdminOrderTypes = ['HAC', 'HAA', 'HPD', 'HKD', 'HTD'];

  const refreshOutputBtfTypes = (bankConnection: BankConnection) => {
    const selectedTypes = orderTypeCache.get(bankConnection.id);
    if (selectedTypes) {
      if (filterType.value == OrderTypeFilter.All) {
        outputBtfTypes.value = selectedTypes.btfTypes;
      } else if (filterType.value == OrderTypeFilter.UploadOnly) {
        outputBtfTypes.value = selectedTypes.btfTypes.filter(
          (btf) => btf.adminOrderType == 'BTU'
        );
      } else if (filterType.value == OrderTypeFilter.DownloadOnly) {
        outputBtfTypes.value = selectedTypes.btfTypes.filter(
          (btf) =>
            btf.adminOrderType == 'BTD' ||
            (displayAdminTypes.value &&
              downloadableAdminOrderTypes.includes(btf.adminOrderType))
        );
      }
    } else {
      console.warn(
        'No BTF types cached for given bank connection: ' +
          bankConnection.id.toString()
      );
    }
  };

  const refreshOutputOrderTypes = (bankConnection: BankConnection) => {
    const selectedTypes = orderTypeCache.get(bankConnection.id);
    if (selectedTypes) {
      if (filterType.value == OrderTypeFilter.All) {
        outputOrderTypes.value = selectedTypes.orderTypes;
      } else if (filterType.value == OrderTypeFilter.UploadOnly) {
        outputOrderTypes.value = selectedTypes.orderTypes.filter(
          (ot) => ot.adminOrderType == 'UPL' || ot.adminOrderType == 'FUL'
        );
      } else if (filterType.value == OrderTypeFilter.DownloadOnly) {
        outputOrderTypes.value = selectedTypes.orderTypes.filter(
          (ot) =>
            ot.adminOrderType == 'DNL' ||
            ot.adminOrderType == 'FDL' ||
            (displayAdminTypes.value &&
              downloadableAdminOrderTypes.includes(ot.adminOrderType)) ||
            ot.transferType == TransferType.Download
        );
      }
    } else {
      console.warn(
        'No OrderTypes cached for given bank connection: ' +
          bankConnection.id.toString()
      );
    }
  };

  watch(
    selectedBankConnection,
    refreshOutputOrdertypesForSelectedBankConnection
  );
  watch(activeBankConnections, updateOrderTypesCacheForAllActiveConnections);

  return {
    btfTypes: outputBtfTypes,
    orderTypes: outputOrderTypes,
    //Can be used for forced refresh from UI
    updateOrderTypesCacheForBankConnection,
  };
}
