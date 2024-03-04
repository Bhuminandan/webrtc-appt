import { combineReducers } from "redux";
import callStatusReducer from "./callStatusReducer";
import streamsReducer from "./streamsReducer";

export const rootReducer = combineReducers({
    callStatus: callStatusReducer,
    streams: streamsReducer
})
