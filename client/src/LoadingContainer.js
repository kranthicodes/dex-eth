import React from "react";
import { getWeb3, getContracts } from "./utils";
import App from "./App";
export default function LoadingContainer() {
  const [web3, setWeb3] = React.useState(null);
  const [accounts, setAccounts] = React.useState([]);
  const [contracts, setContracts] = React.useState(null);

  React.useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const contracts = await getContracts(web3);
      const accounts = await web3.eth.getAccounts();
      setWeb3(web3);
      setContracts(contracts);
      setAccounts(accounts);
    };
    init();
  }, []);
  const isReady = () => {
    return web3 && contracts && accounts.length;
  };
  if (!isReady()) {
    return <div>Loading...</div>;
  }
  return <App web3={web3} accounts={accounts} contracts={contracts} />;
}
