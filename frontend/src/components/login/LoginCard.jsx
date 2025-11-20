import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { Disabled } from '../disabled/Disabled'
import axios from 'axios'
import { AuthContext } from '../../context/Auth'
import { url } from '../../baseUrl'
import googleicon from './google.png'

export const LoginCard = () => {
    const context = useContext(AuthContext)
    const [username, setUsername] = useState('')
    const [password, setPasword] = useState('')

    const login = async () => {
        try {
            // ✅ 수정: text → username으로 변경
            const response = await axios.post(`${url}/auth/login`, {
                username: username,  // 또는 email로 보내도 됨
                password
            })
            
            // ✅ 수정: response.data.data로 변경
            const { user, token } = response.data.data;
            
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem("access_token", token)
            localStorage.setItem("token", token)  // 추가
            context.setAuth(user)
            
            window.location.href = '/';  // 홈으로 리다이렉트
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.data?.message || err.response?.data?.message || '로그인 실패';
            context.throwErr(errorMessage)
        }
    }

    function handleGoogleAuth() {
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const options = {
            redirect_uri: process.env.REACT_APP_GOOGLE_OAUTH_REDIRECT_URL,
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ].join(" "),
        };

        const qs = new URLSearchParams(options);
        window.location.assign(`${rootUrl}?${qs.toString()}`)
    }

    return (
        <div className="right-login">
            <div className="login-box border" style={{ paddingBottom: '10px' }}>
                <img style={{ width: '60%', margin: '35px 0', marginBottom: '25px', }} src={logo} alt="" />
                <input value={username} onChange={(e) => setUsername(e.target.value)} className='border' style={{ marginTop: '10px', width: '75%', height: '37px', fontSize: '13px', padding: '0 9px', outline: 'none', borderRadius: '5px', backgroundColor: '#fafafa ' }} type="text" placeholder='Username or email  address' />
                <input value={password} onChange={(e) => setPasword(e.target.value)} className='border' style={{ marginTop: '15px', width: '75%', height: '37px', fontSize: '13px', backgroundColor: '#fafafa ', padding: '0 9px', outline: 'none', borderRadius: '5px' }} type="password" placeholder='Password' />
                {
                    username !== '' && password !== '' ?
                        <button onClick={() => login()} style={{ border: 'none', outline: 'none', background: 'blue', padding: '7px 9px', borderRadius: '5px', color: 'white', backgroundColor: '#2196f3', marginTop: '18px', fontSize: '13.85px', width: '75%', fontWeight: 'bold' }}>Login</button> : <Disabled text="Login" />
                }
                <div style={{ display: 'flex', margin: '20px 0', width: '75%', alignItems: 'center' }}>
                    <div style={{ height: '1px', flex: 1, borderTop: '1px solid rgb(207, 204, 204)' }}></div>
                    <div style={{ margin: '0 15px', fontSize: '13px', fontWeight: 'bold', color: 'gray' }}>OR</div>
                    <div style={{ height: '1px', flex: 1, borderTop: '1px solid rgb(207, 204, 204)' }}></div>
                </div>
                <p onClick={handleGoogleAuth} style={{ color: '#2196f3', fontWeight: 'bold', fontSize: '13.85px', marginTop: '22px', cursor: 'pointer' }}><img style={{ width: '17px', margin: '-3px 6px', marginRight: '9px' }} src={googleicon} alt="" />Continue with Google</p>
                <p style={{ color: '#2196f3', fontSize: '12.5px', marginTop: '25px', marginBottom: '15px' }}>Forgotten your password ?</p>
            </div>
            <div className="login-action-box border" style={{ textAlign: 'center' }}>
                <p style={{ color: 'gray', fontSize: '14px' }}>Don't have an account?<Link to="/signup" style={{ color: '#2196f3', fontWeight: 'bold', marginLeft: '6px', textDecoration: 'none', fontSize: '13.5px' }}>Sign up</Link></p>
            </div>
        </div>
    )
}
