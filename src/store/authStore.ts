import { Commit } from "vuex";

interface AuthState {
  token: string | null;
  decodedToken: string | null;
}

const authStore = {
  state: {
    token: null,
  } as AuthState,

  mutations: {
    setToken(state: AuthState, token: string | null) {
      state.token = token;
    },
    setDecodedToken(state: AuthState, token: string | null) {
      state.decodedToken = token;
    },
  },

  actions: {
    saveToken({ commit }: { commit: Commit }, token: string) {
      commit("setToken", token);
    },
    saveDecodedToken({ commit }: { commit: Commit }, decodedToken: string) {
      commit("setDecodedToken", decodedToken);
    },
  },
  getters: {
    getDecodedToken(state: AuthState) {
      return state.decodedToken;
    },
  },
};

export default authStore;
