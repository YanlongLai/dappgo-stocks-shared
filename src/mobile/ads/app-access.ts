import { isStoreOperationInProgress, subscribeStoreOperation } from '../purchases/store-operation';
import { isUpdateAccessAllowed, subscribeUpdateAccess } from '../updates/update-access';
import { isAppAdUiBlocked, subscribeAppAdUi } from './ui-ad-access';

export function canUseAppAds(): boolean {
  return isUpdateAccessAllowed() && !isStoreOperationInProgress() && !isAppAdUiBlocked();
}
export function subscribeAppAdAccess(listener: () => void): () => void {
  const stopPolicy = subscribeUpdateAccess(listener);
  const stopStore = subscribeStoreOperation(listener);
  const stopUi = subscribeAppAdUi(listener);
  return () => { stopPolicy(); stopStore(); stopUi(); };
}
