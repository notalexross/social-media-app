import { useParams } from 'react-router-dom'
import { EditUser } from '../components'
import { useUser } from '../hooks'

export default function EditUserContainer(
  props: React.ComponentPropsWithoutRef<'div'>
): JSX.Element {
  const { username } = useParams<{ username: string | undefined }>()
  const user = useUser(username, { by: 'username', includePrivate: true, subscribe: true })

  const labelClassName = 'block mb-4 w-full leading-5'
  const inputClassName = 'px-4 py-2.5 w-full border rounded bg-clr-input text-sm'
  const labelSpanClassName = 'inline-block mb-2'
  const showPasswordSpanClassName = 'inline-block ml-2'

  const submit = (
    <div className="mt-4">
      <EditUser.Error className="mb-4 text-clr-error leading-none" />
      <EditUser.Success className="mb-4 text-clr-success leading-none">
        Updated Successfully
      </EditUser.Success>
      <EditUser.Submit className="block px-6 py-2 w-full rounded bg-clr-accent font-bold text-clr-secondary hover:bg-clr-accent-hover focus:bg-clr-accent-hover disabled:bg-clr-accent disabled:opacity-50 disabled:cursor-not-allowed">
        Save
      </EditUser.Submit>
    </div>
  )

  return (
    <EditUser className="mt-2" user={user} {...props}>
      <h2 className="mb-4 font-bold text-lg">Update Details</h2>
      <EditUser.Form className="mt-4">
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="username"
        >
          <span className={labelSpanClassName}>Username</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="fullName"
        >
          <span className={labelSpanClassName}>Full Name</span>
        </EditUser.LabelledInput>
        {submit}
      </EditUser.Form>
      <EditUser.Form className="mt-4">
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="email"
        >
          <span className={labelSpanClassName}>Email</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="currentPassword"
        >
          <span className={labelSpanClassName}>Current Password</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          type="togglePassword"
          childPosition="after"
        >
          <span className={showPasswordSpanClassName}>Show Password</span>
        </EditUser.LabelledInput>
        {submit}
      </EditUser.Form>
      <EditUser.Form className="mt-4">
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="password"
        >
          <span className={labelSpanClassName}>New Password</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="confirmPassword"
        >
          <span className={labelSpanClassName}>Confirm New Password</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          inputClassName={inputClassName}
          type="currentPassword"
        >
          <span className={labelSpanClassName}>Current Password</span>
        </EditUser.LabelledInput>
        <EditUser.LabelledInput
          className={labelClassName}
          type="togglePassword"
          childPosition="after"
        >
          <span className={showPasswordSpanClassName}>Show Passwords</span>
        </EditUser.LabelledInput>
        {submit}
      </EditUser.Form>
    </EditUser>
  )
}
