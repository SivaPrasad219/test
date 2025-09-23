import { createStore } from "vuex";
import userStore from "./userStore";
import authStore from "./authStore";
import internationalization from "./interNationalization";
export default createStore({
  modules: {
    userStore,
    authStore,
    internationalization,
  },
  state: {},
  getters: {},
  mutations: {},
  actions: {},
});
