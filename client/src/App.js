import React from "react";
import AllOrders from "./AllOrders.js";
import AllTrades from "./AllTrades.js";
import Footer from "./Footer.js";
import Header from "./Header.js";
import MyOrders from "./MyOrders.js";
import NewOrder from "./NewOrder.js";
import Wallet from "./Wallet.js";
const SIDE = {
  BUY: 0,
  SELL: 1,
};
function App({ web3, contracts, accounts }) {
  const [tokens, setTokens] = React.useState(null);
  const [user, setUser] = React.useState({
    accounts: [],
    balances: {
      tokenDex: 0,
      tokenWallet: 0,
    },
    selectedToken: undefined,
  });
  const [orders, setOrders] = React.useState({
    buy: [],
    sell: [],
  });
  const [trades, setTrades] = React.useState([]);
  const [listener, setListener] = React.useState(null);
  const selectToken = (token) => {
    setUser((oldState) => ({
      ...oldState,
      selectedToken: token,
    }));
  };
  React.useEffect(() => {
    const init = async () => {
      const rawTokens = await contracts.dex.methods.getTokens().call();
      const tokens = rawTokens.map((token) => ({
        ...token,
        ticker: web3.utils.hexToUtf8(token.ticker),
      }));
      const balances = await getBalances(accounts[0], tokens[0]);
      const orders = await getOrders(tokens[0]);
      listenToTrades(tokens[0]);
      setOrders(orders);
      setTokens(tokens);
      setUser({ accounts, balances, selectedToken: tokens[0] });
    };
    init();
  }, []);
  React.useEffect(
    () => {
      const init = async () => {
        const balances = await getBalances(accounts[0], user.selectedToken);
        const orders = await getOrders(user.selectedToken);
        listenToTrades(user.selectedToken);
        setOrders(orders);
        setUser((oldState) => ({ ...oldState, balances }));
      };
      if (user.selectedToken) {
        init();
      }
    },
    [user.selectedToken],
    () => {
      listener.unsubscribe();
    }
  );

  const getBalances = async (account, token) => {
    const tokenDex = await contracts.dex.methods
      .traderBalances(account, web3.utils.fromAscii(token.ticker))
      .call();
    const tokenWallet = await contracts[token.ticker].methods
      .balanceOf(account)
      .call();
    return { tokenDex, tokenWallet };
  };
  const getOrders = async (token) => {
    const orders = await Promise.all([
      contracts.dex.methods
        .getOrders(web3.utils.fromAscii(token.ticker), SIDE.BUY)
        .call(),
      contracts.dex.methods
        .getOrders(web3.utils.fromAscii(token.ticker), SIDE.SELL)
        .call(),
    ]);
    return { buy: orders[0], sell: orders[1] };
  };
  const listenToTrades = (token) => {
    const tradeIds = new Set();
    setTrades([]);
    const tradeListener = contracts.dex.events
      .NewTrade({
        filter: { ticker: web3.utils.fromAscii(token.ticker) },
        fromBlock: 0,
      })
      .on("data", (newTrade) => {
        if (tradeIds.has(newTrade.returnValues.tradeId)) return;
        tradeIds.add(newTrade.returnValues.tradeId);
        setTrades((trades) => [...trades, newTrade.returnValues]);
      });
    setListener(tradeListener);
  };
  const deposit = async (amount) => {
    await contracts[user.selectedToken.ticker].methods
      .approve(contracts.dex.options.address, amount)
      .send({ from: user.accounts[0] });
    await contracts.dex.methods
      .deposit(amount, web3.utils.fromAscii(user.selectedToken.ticker))
      .send({ from: user.accounts[0] });
    const balances = await getBalances(user.accounts[0], user.selectedToken);
    setUser((oldState) => ({
      ...oldState,
      balances,
    }));
  };
  const withdraw = async (amount) => {
    await contracts.dex.methods
      .withdraw(amount, web3.utils.fromAscii(user.selectedToken.ticker))
      .send({ from: user.accounts[0] });
    const balances = await getBalances(user.accounts[0], user.selectedToken);
    setUser((oldState) => ({
      ...oldState,
      balances,
    }));
  };
  const createLimitOrder = async (amount, price, side) => {
    await contracts.dex.methods
      .createLimitOrder(
        web3.utils.fromAscii(user.selectedToken.ticker),
        amount,
        price,
        side
      )
      .send({ from: user.accounts[0] });
    const orders = await getOrders(user.selectedToken);
    setOrders(orders);
  };
  const createMarketOrder = async (amount, side) => {
    await contracts.dex.methods
      .createMarketOrder(
        web3.utils.fromAscii(user.selectedToken.ticker),
        amount,
        side
      )
      .send({ from: user.accounts[0] });
    const orders = await getOrders(user.selectedToken);
    setOrders(orders);
    //
  };
  if (!user.selectedToken) {
    return <div>Loading....</div>;
  }
  return (
    <div id="app">
      <Header
        user={user}
        contracts={contracts}
        tokens={tokens}
        selectToken={selectToken}
      />
      <main className="container-fluid">
        <div className="row">
          <div className="col-sm-4 first-col">
            <Wallet user={user} deposit={deposit} withdraw={withdraw} />
            {user.selectedToken.ticker !== "DAI" ? (
              <NewOrder
                createLimitOrder={createLimitOrder}
                createMarketOrder={createMarketOrder}
              />
            ) : null}
          </div>
          {user.selectedToken?.ticker !== "DAI" ? (
            <div className="col-sm-8">
              <AllTrades trades={trades} />
              <AllOrders orders={orders} />
              <MyOrders
                orders={{
                  buy: orders.buy.filter(
                    (order) =>
                      order.trader.toLowerCase() ===
                      user.accounts[0].toLowerCase()
                  ),
                  sell: orders.sell.filter(
                    (order) =>
                      order.trader.toLowerCase() ===
                      user.accounts[0].toLowerCase()
                  ),
                }}
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
