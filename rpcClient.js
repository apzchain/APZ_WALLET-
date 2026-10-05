import axios from "axios";

const RPC_URL = "https://rpc.apzchain.org";

export default async function rpcClient(method, params) {
  const response = await axios.post(RPC_URL, {
    method,
    params,
    id: 1,
  });
  return response.data.result;
}
