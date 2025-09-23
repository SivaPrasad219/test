import { Commit } from "vuex";

interface InternationalizationState {
  locale: string | null;
}

const internationalization = {
  state: () => ({
    locale: localStorage.getItem("language")
      ? localStorage.getItem("language")
      : "en",
  }),
  mutations: {
    setLocale(state: InternationalizationState, locale: string | null) {
      state.locale = locale;
    },
  },
  actions: {
    setLocale({ commit }: { commit: Commit }, locale: string) {
      console.log("Action saveLocale called with locale:", locale);
      commit("setLocale", locale);
    },
  },
  getters: {
    getLocale(state: InternationalizationState) {
      return state.locale;
    },
  },
};

export default internationalization;
