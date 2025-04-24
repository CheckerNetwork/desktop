import { useState } from 'react'
import { NavLink } from 'react-router'
import { ROUTES } from 'src/lib/routes'
import HomeIcon from 'src/assets/img/icons/home.svg?react'
import SubnetsIcon from 'src/assets/img/icons/subnets.svg?react'
import WalletIcon from 'src/assets/img/icons/menu-wallet.svg?react'
import SettingsIcon from 'src/assets/img/icons/settings.svg?react'
import MenuArrow from 'src/assets/img/icons/menu-arrow.svg?react'
import Logo from 'src/assets/img/icons/logo-symbol.svg?react'
import classNames from 'classnames'
import Transition from './Transition'

const links = [
  {
    href: ROUTES.dashboard,
    title: 'Dashboard',
    Icon: HomeIcon
  },
  {
    href: ROUTES.subnets,
    title: 'Subnets',
    Icon: SubnetsIcon
  },
  {
    href: ROUTES.wallet,
    title: 'Wallet',
    Icon: WalletIcon
  },
  {
    href: ROUTES.settings,
    title: 'Settings',
    Icon: SettingsIcon
  }
]

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className={classNames(
      'sticky top-0 group pt-9 transition-all',
      isOpen ? 'w-[155px]' : 'w-[80px]'
    )}
    >
      <div className='flex flex-col items-center gap-9 px-4 pt-5'>
        <Logo />

        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className='nav-button absolute right-0 top-16 translate-x-[50%]
          opacity-0 group-hover:opacity-100 focus:opacity-100'
        >
          <div className={classNames('text-primary', {
            'rotate-180': isOpen
          })}
          >
            <MenuArrow />
          </div>
        </button>

        <nav className='flex flex-col gap-2 w-full'>
          {links.map(({ href, title, Icon }) => (
            <NavLink
              to={href}
              key={href}
              className={({ isActive }) => classNames(
                'flex gap-2 items-center py-3.5 px-3.5 nav-button',
                { active: isActive }
              )}
            >
              <div className='w-5'>
                <Icon />
              </div>
              <Transition
                as='span'
                on={isOpen}
                delayIn={100}
                className='uppercase text-body-2xs'
              >
                {title}
              </Transition>
            </NavLink>
          ))}
        </nav>
      </div>
    </section>
  )
}

export default Sidebar
