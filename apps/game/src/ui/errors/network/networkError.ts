import { ErrorType } from '@shared';
import { HistoryRouterProps, NavigateFunction } from 'react-router-dom';
import { toast } from 'react-toastify';


export default function networkError(message: string, errorType: ErrorType, navigate: NavigateFunction) {

  console.log(`Network error: ${message}`);
  switch (errorType) {
    case ErrorType.NetworkError:
      toast('Network: ' + message, { type: 'error' });
      break;
    case ErrorType.WorldNotFound:
      toast(message, { type: 'error' });
      navigate('/worlds');
      break;
    default:
      toast('Unknown error: ' + message, { type: 'error' });
  }

}
