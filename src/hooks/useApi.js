import http from "../services/http";

const useApi = () => {
  const get = async (url, config = {}) => {
    const res = await http.get(url, config);
    return res.data;
  };

  const post = async (url, data, config = {}) => {
    const res = await http.post(url, data, config);
    return res.data;
  };

  const put = async (url, data, config = {}) => {
    const res = await http.put(url, data, config);
    return res.data;
  };

  const patch = async (url, data = {}, config = {}) => {
    const res = await http.patch(url, data, config);
    return res.data;
  };

  const remove = async (url, config = {}) => {
    const res = await http.delete(url, config);
    return res.data;
  };

  const postBlob = async (url, data, config = {}) => {
    return http.post(url, data, { responseType: "blob", ...config });
  };

  return { get, post, put, patch, remove, postBlob };
};

export default useApi;
