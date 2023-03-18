import { ErrorType } from "@shared/errors/errorTypes";
import { toast } from "react-toastify";

export default function networkError(message: string, errorType: ErrorType) {
  console.log(`Network error: ${message}`)
  switch (errorType) {
    case ErrorType.NetworkError:
        toast("Network: " + message, {type: 'error'});
  }
}