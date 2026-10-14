import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import Layout from './Layout/Layout';
import Home from './Pages/Home/Home';
import Profile from './Pages/Profile/Profile';
import BookmarksPosts from './BookmarksPosts/BookmarksPosts';
import ChangePassword from './ChangePassword/ChangePassword';
import Login from './Pages/Login/Login';
import Register from './Pages/Register/Register';
import Notfound from './Pages/Notfound/Notfound';
import CounterContextProvider from './Context/CounterContex';
import AuthContextProvider from './Context/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PostDetails from './Pages/PostDetails/PostDetails';
import UserProfile from './UserProfile/UserProfile'; 
import Notifications from './Notifications/Notifications';

const query = new QueryClient();

const routers = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/:id", element: <UserProfile /> }, 
      { path: "community", element: <Home /> },
      { path: "saved", element: <BookmarksPosts /> },
      { path: "settings", element: <ChangePassword /> },
      { path: "PostDetails/:id", element: <PostDetails /> },
      { path: "notifications", element: <Notifications /> }
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "*", element: <Notfound /> },
]);

function App() {
  return (
    <QueryClientProvider client={query}>
      <AuthContextProvider>
        <CounterContextProvider>
          <RouterProvider router={routers} />
        </CounterContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  );
}

export default App;