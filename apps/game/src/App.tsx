import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.scss';
import { events } from './events/Events';
import LobbyPage from './ui/pages/lobby/LobbyPage';
import WorldPage from './ui/pages/world/WorldPage';
import networkError from './ui/errors/network/networkError';
import { useNavigate } from 'react-router-dom';
import LoginPage from './ui/pages/login/LoginPage';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, gql, useQuery } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { apiUrl } from '@shared';
import { UserContext } from './ui/context/user/UserContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const httpLink = new HttpLink({ uri: apiUrl + '/graphql' });
const authLink = setContext(async (_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token || '',
    },
  };
});

// Initialize Apollo Client
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {},
});

export default function App() {
  return (
    <div className="App">
      <ApolloProvider client={client}>
        <ToastContainer theme="dark" />
        <DndProvider backend={HTML5Backend}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DndProvider>
      </ApolloProvider>
    </div>
  );
}

export const ME_QUERY = gql`
  query Me {
    Me {
      balance
      display_name
      email
      id
      isConfirmed
      last_login
    }
  }
`;
function AppRoutes() {
  const { loading, error, data } = useQuery(ME_QUERY);

  const navigate = useNavigate();
  useEffect(() => {
    events.subscribe('networkError', ({ message, type }) => {
      networkError(message, type, navigate);
    });
    return () => {
      events.unsubscribe('networkError', () => {});
    };
  }, [navigate]);

  useEffect(() => {
    if (data?.Me == null && !loading) {
      navigate('/login');
    }
  }, [data, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <UserContext.Provider value={data.Me}>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        {!data.Me && <Route path="/login" element={<LoginPage />} />}
        <Route path="/world/:worldId" element={<WorldPage />} />
        <Route path="*" element={<LobbyPage />} />
      </Routes>
    </UserContext.Provider>
  );
}
