from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json
import os
import logging

router = APIRouter(prefix='/auth')
logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class UpdateProfileRequest(BaseModel):
    current_email: str = Field(..., min_length=3)
    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = Field(default=None, min_length=3)
    password: Optional[str] = Field(default=None, min_length=6)


def _users_store_path() -> str:
    return os.path.join(os.path.dirname(__file__), '..', 'data', 'users_store.json')


def _default_users() -> List[Dict[str, str]]:
    return [
        {
            'email': 'admin@gmail.com',
            'password': 'admin123',
            'name': 'Admin',
            'role': 'admin',
        },
        {
            'email': 'citizen@example.com',
            'password': 'citizen123',
            'name': 'Citizen Demo',
            'role': 'citizen',
        },
    ]


def _read_users() -> List[Dict[str, str]]:
    store_path = _users_store_path()
    if not os.path.exists(store_path):
        users = _default_users()
        _write_users(users)
        return users

    with open(store_path, 'r') as store_file:
        data = json.load(store_file)

    if not isinstance(data, list):
        users = _default_users()
        _write_users(users)
        return users

    return data


def _write_users(users: List[Dict[str, str]]) -> None:
    store_path = _users_store_path()
    with open(store_path, 'w') as store_file:
        json.dump(users, store_file, indent=2)


def _session_payload(user: Dict[str, str]) -> Dict[str, Any]:
    return {
        'user': {
            'email': user['email'],
            'name': user['name'],
            'role': user['role'],
        }
    }


def _success_response(message: str, data: Any) -> Dict[str, Any]:
    return {
        'status': 'success',
        'message': message,
        'data': data,
    }


def _public_user_payload(user: Dict[str, str]) -> Dict[str, str]:
    return {
        'email': user['email'],
        'name': user['name'],
        'role': user['role'],
    }


@router.post('/login', tags=['Auth'])
async def login(payload: LoginRequest):
    logger.info('Auth login attempt received for email=%s', payload.email.strip().lower())
    users = _read_users()
    email = payload.email.strip().lower()

    matched_user = next(
        (
            user
            for user in users
            if user.get('email', '').lower() == email
            and user.get('password') == payload.password
        ),
        None,
    )

    if not matched_user:
        logger.warning('Auth login failed for email=%s', email)
        raise HTTPException(status_code=401, detail='Invalid credentials. Please check your email and password.')

    logger.info('Auth login successful for email=%s role=%s', email, matched_user.get('role'))
    return _success_response('User logged in successfully.', _session_payload(matched_user))


@router.post('/signup', tags=['Auth'])
async def signup(payload: SignupRequest):
    logger.info('Auth signup request received for email=%s name=%s', payload.email.strip().lower(), payload.name.strip())
    users = _read_users()
    email = payload.email.strip().lower()

    if any(user.get('email', '').lower() == email for user in users):
        logger.warning('Auth signup blocked due to duplicate email=%s', email)
        raise HTTPException(status_code=409, detail='An account with this email already exists.')

    new_user = {
        'name': payload.name.strip(),
        'email': email,
        'password': payload.password,
        'role': 'citizen',
    }

    users.append(new_user)
    _write_users(users)
    logger.info('Auth signup successful for email=%s', email)
    return _success_response('User created successfully.', _session_payload(new_user))


@router.put('/profile', tags=['Auth'])
async def update_profile(payload: UpdateProfileRequest):
    current_email = payload.current_email.strip().lower()
    users = _read_users()

    matched_index = next(
        (
            index
            for index, user in enumerate(users)
            if user.get('email', '').lower() == current_email
        ),
        None,
    )

    if matched_index is None:
        raise HTTPException(status_code=404, detail='Account not found.')

    update_name = payload.name.strip() if payload.name is not None else None
    update_email = payload.email.strip().lower() if payload.email is not None else None
    update_password = payload.password if payload.password is not None else None

    if update_name is None and update_email is None and update_password is None:
        raise HTTPException(status_code=400, detail='No profile changes were provided.')

    if update_email and update_email != current_email:
        if any(user.get('email', '').lower() == update_email for user in users):
            raise HTTPException(status_code=409, detail='An account with this email already exists.')

    updated_user = dict(users[matched_index])
    if update_name is not None:
        updated_user['name'] = update_name
    if update_email is not None:
        updated_user['email'] = update_email
    if update_password is not None:
        updated_user['password'] = update_password

    users[matched_index] = updated_user
    _write_users(users)
    logger.info('Auth profile updated for email=%s', updated_user.get('email'))
    return _success_response('Profile updated successfully.', _session_payload(updated_user))
