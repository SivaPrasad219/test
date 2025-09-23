// userStore.ts
import { Commit } from "vuex";

interface UserState {
  username: string;
  deviceTypeId: string | null;
  deviceTypeName: string | null;
  currentStep: number;
  isLoggedIn: boolean;
}

const getDefaultState = (): UserState => {
  const initialDeviceTypeId = localStorage.getItem("deviceTypeId") || null;
  const initialDeviceTypeName = localStorage.getItem("deviceTypeName") || null;
  const token = localStorage.getItem("Token");
  const isLoginByDefault = token ? true : false;
  return {
    username: "Guest",
    deviceTypeId: initialDeviceTypeId,
    deviceTypeName: initialDeviceTypeName,
    currentStep: 0,
    isLoggedIn: isLoginByDefault,
  };
};

const userStore = {
  state: getDefaultState(),

  mutations: {
    setUsername(state: UserState, name: string) {
      state.username = name;
    },
    setDeviceTypeId(state: UserState, id: string | null) {
      state.deviceTypeId = id;
    },
    setDeviceTypeName(state: UserState, name: string | null) {
      state.deviceTypeName = name;
    },
    setCurrentStep(state: UserState, step: number) {
      state.currentStep = step;
    },
    setIsLoggedIn(state: UserState, condition: boolean) {
      state.isLoggedIn = condition;
    },
    resetState(state: UserState) {
      Object.assign(state, getDefaultState());
    },
  },

  actions: {
    updateUsername({ commit }: { commit: Commit }, newName: string) {
      setTimeout(() => {
        commit("setUsername", newName);
      }, 1000);
    },
    setDeviceTypeId({ commit }: { commit: Commit }, id: string | null) {
      commit("setDeviceTypeId", id);
    },
    setDeviceTypeName({ commit }: { commit: Commit }, name: string | null) {
      commit("setDeviceTypeName", name);
    },
    setCurrentStep({ commit }: { commit: Commit }, step: number) {
      commit("setCurrentStep", step);
    },
    setIsLoggedIn({ commit }: { commit: Commit }, condition: boolean) {
      commit("setIsLoggedIn", condition);
    },
    resetState({ commit }: { commit: Commit }) {
      commit("resetState");
    },
  },

  getters: {
    uppercaseUsername(state: UserState) {
      return state.username.toUpperCase();
    },
    getDeviceTypeId(state: UserState) {
      return state.deviceTypeId;
    },
    getDeviceTypeName(state: UserState) {
      return state.deviceTypeName;
    },
    getCurrentStep(state: UserState) {
      return state.currentStep;
    },
    getIsLoggedIn(state: UserState) {
      return state.isLoggedIn;
    },
  },
};

export default userStore;
