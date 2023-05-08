import { gql, useMutation } from '@apollo/client';
import { ME_QUERY, client } from '../../../App';
import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LOGIN_MUTATION = gql`
  mutation UserLogin($email: String!, $password: String!) {
    UserLogin(email: $email, password: $password) {
      token
      success
      message
    }
  }
`;
export default function LoginPage() {
  const [mutateLogin, { data, loading, error }] = useMutation(LOGIN_MUTATION);

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Sending login request');
    mutateLogin({ variables: { email, password } });
  };

  useEffect(() => {
    if (data?.UserLogin?.success) {
      localStorage.setItem('token', data.UserLogin.token);

      client
        .refetchQueries({
          include: [ME_QUERY],
        })
        .then(() => navigate('/'));
    }
  }, [data, navigate]);

  return (
    <div className="text-center">
      <h1 className="my-8">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col w-[200px] m-auto space-y-4">
        <label htmlFor="email">Email</label>
        <input className="p-2" type="text" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input className="p-2" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <Button disabled={loading} title="Login" type="submit">
          Login
          {loading && <Spinner animation="border" size="sm" className="ml-2" />}
        </Button>
        <p className="text-red-600">{error?.message || data?.UserLogin?.message}</p>
      </form>
    </div>
  );
}
