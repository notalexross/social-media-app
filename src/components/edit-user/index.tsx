import { createContext, useContext, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { changeEmail, changePassword, editUser, User } from '../../services/firebase'
import { disableForm, enableElements, stringifyError } from '../../utils'

type Values = {
  fullName: string
  email: string
  username: string
  currentPassword: string
  password: string
  confirmPassword: string
  togglePassword: boolean
}

type EditUserContextValue = {
  user: User | undefined
  fullNameCharacterLimit: number
  usernameCharacterLimit: number
}

const EditUserContext = createContext<EditUserContextValue>({} as EditUserContextValue)

type EditUserProps = {
  user: User | undefined
  usernameCharacterLimit?: number
  fullNameCharacterLimit?: number
} & React.ComponentPropsWithoutRef<'div'>

export default function EditUser({
  user,
  usernameCharacterLimit = 15,
  fullNameCharacterLimit = 50,
  ...restProps
}: EditUserProps): JSX.Element {
  return (
    <EditUserContext.Provider value={{ user, fullNameCharacterLimit, usernameCharacterLimit }}>
      <div {...restProps} />
    </EditUserContext.Provider>
  )
}

type EditUserFormContextValue = {
  isLoaded: boolean
  values: Values
  handleChange: React.ChangeEventHandler<HTMLInputElement>
  error: string
  didUpdate: boolean
}

const EditUserFormContext = createContext<EditUserFormContextValue>({} as EditUserFormContextValue)

const initialValues = {
  fullName: '',
  email: '',
  username: '',
  currentPassword: '',
  password: '',
  confirmPassword: '',
  togglePassword: false
}

EditUser.Form = function EditUserForm(props: React.ComponentPropsWithoutRef<'form'>) {
  const { user, fullNameCharacterLimit, usernameCharacterLimit } = useContext(EditUserContext)
  const [values, setValues] = useState<Values>(initialValues)
  const [error, setError] = useState('')
  const [didUpdate, setDidUpdate] = useState(false)
  const { fullName, email, username } = user || {}
  const isLoaded = fullName !== undefined && email !== undefined && username !== undefined

  useEffect(() => {
    if (isLoaded) {
      setValues(state => ({ ...state, fullName }))
    }
  }, [isLoaded, fullName])

  useEffect(() => {
    if (isLoaded) {
      setValues(state => ({ ...state, email }))
    }
  }, [isLoaded, email])

  useEffect(() => {
    if (isLoaded) {
      setValues(state => ({ ...state, username }))
    }
  }, [isLoaded, username])

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    setValues(state => {
      const { name, type } = target
      const value = target[type === 'checkbox' ? 'checked' : 'value']
      const currentValue = state[name as keyof Values]
      const valuesAreStrings = typeof value === 'string' && typeof currentValue === 'string'
      const fullNameCharacterLimitPassed =
        name === 'fullName' && valuesAreStrings && value.length > fullNameCharacterLimit
      const usernameCharacterLimitPassed =
        name === 'username' && valuesAreStrings && value.length > usernameCharacterLimit
      const isCharacterDeletion =
        valuesAreStrings && value.length < currentValue.length && value.length >= 0

      if (isCharacterDeletion || (!fullNameCharacterLimitPassed && !usernameCharacterLimitPassed)) {
        return { ...state, [name]: value }
      }

      return state
    })
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    setDidUpdate(false)
    setError('')
    event.preventDefault()
    const disabledElements = disableForm(event.currentTarget)

    try {
      const updateTypes: ('basic' | 'password' | 'email')[] = []
      const basicUpdates: {
        fullName?: string
        username?: string
      } = {}

      if (!!values.fullName && values.fullName !== fullName) {
        basicUpdates.fullName = values.fullName
      }

      if (!!values.username && values.username !== username) {
        basicUpdates.username = values.username
      }

      if (Object.keys(basicUpdates).length) {
        updateTypes.push('basic')
      }

      if (!!values.password || !!values.confirmPassword) {
        if (values.password !== values.confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        if (!values.currentPassword) {
          throw new Error('You must enter your current password.')
        }

        if (values.password === values.currentPassword) {
          throw new Error('Your new password cannot be the same as your current password.')
        }

        updateTypes.push('password')
      }

      if (!!values.email && values.email !== email) {
        if (!values.currentPassword) {
          throw new Error('You must enter your current password.')
        }

        updateTypes.push('email')
      }

      if (updateTypes.length > 0) {
        if (updateTypes.length === 1) {
          const updateType = updateTypes[0]

          if (updateType === 'basic') {
            await editUser(basicUpdates)
          } else if (updateType === 'password') {
            await changePassword(values.password, values.currentPassword)
          } else if (updateType === 'email') {
            await changeEmail(values.email, values.currentPassword)
          }

          setDidUpdate(true)
        } else {
          throw new Error('Password and email can only be updated independently.')
        }
      } else {
        throw new Error('No changes were made.')
      }
    } catch (err: unknown) {
      console.error(err)
      setError(stringifyError(err))
    } finally {
      enableElements(disabledElements)
    }
  }

  return (
    <EditUserFormContext.Provider value={{ isLoaded, values, handleChange, error, didUpdate }}>
      <form onSubmit={handleSubmit} {...props} />
    </EditUserFormContext.Provider>
  )
}

type InputType =
  | 'fullName'
  | 'email'
  | 'username'
  | 'currentPassword'
  | 'password'
  | 'confirmPassword'
  | 'togglePassword'

type EditUserLabelledInputProps = {
  type: InputType
  inputClassName?: string
  childPosition?: 'before' | 'after'
} & React.ComponentPropsWithoutRef<'span'>

EditUser.LabelledInput = function EditUserLabelledInput({
  children,
  type,
  inputClassName,
  childPosition = 'before',
  ...restProps
}: EditUserLabelledInputProps) {
  const { isLoaded, values, handleChange } = useContext(EditUserFormContext)

  let inputType: 'checkbox' | 'text' | 'password' = 'text'
  let changeAttribute: 'checked' | 'value' = 'value'
  if (type === 'togglePassword') {
    inputType = 'checkbox'
    changeAttribute = 'checked'
  } else if (type === 'password' || type === 'confirmPassword' || type === 'currentPassword') {
    inputType = values.togglePassword ? 'text' : 'password'
  }

  const inputProps = {
    className: inputClassName,
    name: type,
    type: inputType,
    onChange: handleChange,
    [changeAttribute]: values[type]
  }

  let input: JSX.Element
  if (isLoaded || type === 'togglePassword') {
    input = <input {...inputProps} />
  } else {
    input = <Skeleton style={{ lineHeight: 'inherit' }} {...inputProps} />
  }

  return (
    <label {...restProps}>
      {childPosition === 'before' ? children : null}
      {input}
      {childPosition === 'after' ? children : null}
    </label>
  )
}

EditUser.Submit = function EditUserSubmit(props: React.ComponentPropsWithoutRef<'button'>) {
  return <button type="submit" {...props} />
}

EditUser.Error = function EditUserError(
  props: Omit<React.ComponentPropsWithoutRef<'p'>, 'children'>
) {
  const { error } = useContext(EditUserFormContext)

  return error ? <p {...props}>{error}</p> : <></>
}

EditUser.Success = function EditUserSuccess(props: React.ComponentPropsWithoutRef<'p'>) {
  const { didUpdate } = useContext(EditUserFormContext)

  return didUpdate ? <p {...props} /> : <></>
}
