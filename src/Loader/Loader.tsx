
import { CircularProgress } from "react-loader-spinner";

export default function Loader() {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <CircularProgress
        height="100"
        width="100"
        color="#4fa94d"
        ariaLabel="circular-progress-loading"
        wrapperStyle={{}}
        wrapperClass="wrapper-class"
        visible={true}
        strokeWidth={2}
        animationDuration={1}
      />
    </div>
  );
}