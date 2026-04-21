import React from "react";
import unAuth from "../../assets/svg/401 Error Unauthorized-rafiki.svg";

const Unauthorized = () => {
  return (
    <div className="container">
      <div className="row justify-content-center align-items-center vh-100">
        <div className="col-md-10">
          <div className="d-flex justify-content-center align-items-center">
            <img
              src={unAuth}
              width={"50%"}
              alt="unauthorized"
              className="img-fluid"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
