import React, { useEffect, useState } from "react";
import QRCode from "qrcode.react";
import { useNavigate } from "react-router";

import {
  postDeviceInfo,
  requestConfig,
  requestQR,
  requestToken,
  postConfigInfo
} from "./actions";
import { useDispatch, useSelector } from "react-redux";
import { useInterval } from "../useInterval";

export default () => {
  const RunStep = Object.freeze({
    RequestQR: 1,
    RequestToken: 2,
    RequestConfig: 3,
    Finished: 4,
  });

  const [runStep, setRunStep] = useState(RunStep.RequestQR);
  const [message, setMessage] = useState();
  const delay = 2000;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const qrState = useSelector((state) => state.qrReducer);
  const { QR, token, configInfo } = qrState;

  const stateLoop = () => {
    if (QR.qrUrl && runStep === RunStep.RequestQR) {
      setRunStep(() => RunStep.RequestToken);
      setMessage(() => "request token...");
      dispatch(requestToken(QR.authorizeCode));
    } else if (!token.access_token && runStep === RunStep.RequestToken) {
      dispatch(requestToken(QR.authorizeCode));
    } else if (token.access_token && runStep === RunStep.RequestToken) {
      setMessage(() => "upload device information...");
      setRunStep(() => RunStep.RequestConfig);
      dispatch(postDeviceInfo(token.access_token, QR.authorizeCode))
    } else if (!configInfo.fileServer && runStep === RunStep.RequestConfig) {
      setMessage(() => "request config information...");
      console.log("request config...");
      //配置信息必须在用户手动授权后再返回
      dispatch(requestConfig(token.access_token));
    } else if (configInfo.fileServer && runStep === RunStep.RequestConfig) {
      setRunStep(() => RunStep.Finished);
      setMessage(() => "config finished!");
      configInfo.token = token.access_token;
      dispatch(postConfigInfo(configInfo))
    }else if(runStep === RunStep.Finished){
      navigate("/play");
    }
  };

  useInterval(stateLoop, delay);

  useEffect(() => {
    dispatch(requestQR());
  }, []);

  const divStyles = {
    margin: "0 auto",
    top: "30%",
    position: "absolute",
  };

  return (
    <div className="container-fluid" style={divStyles}>
      <div className="row">
        <div className="col">
          {QR.qrUrl && (
            <QRCode value={QR.qrUrl} size={256} className="float-right" />
          )}
        </div>
        <div
          className="col"
          style={{
            padding: "5%",
          }}
        >
          <h1>Scan QR code to activate device,Please.</h1>
          <div>
            * Ensure activate a trial or purchase the license in PC before you
            scan the QR code
          </div>
          <div>{message}</div>
        </div>
      </div>
    </div>
  );
};
