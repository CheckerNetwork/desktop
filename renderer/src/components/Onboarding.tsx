import { FC, useState, PropsWithChildren } from 'react'
import Back from 'src/assets/img/icons/arrow-left.svg?react'
import PaginatorPage from 'src/assets/img/icons/paginator-page.svg?react'
import CurrentPage from 'src/assets/img/icons/paginator-current.svg?react'
import { showTermsOfService } from 'src/lib/checker-config'

interface FooterProps {
  page: number;
  pages: number;
  next: () => void;
  prev: () => void;
}

const Footer: FC<FooterProps> = ({ page, pages, next, prev }) => {
  return (
    <div className="flex justify-between">
      <button
        className={`
          btn-secondary-small flex items-center group back-button border-none disabled:opacity-30 text-white
        `}
        disabled={page === 0}
        onClick={prev}
        type="button"
      >
        <i><Back className="btn-icon-primary-small" fill="white" /></i>
        <span>Back</span>
      </button>
      {page !== 2 && (
        <div className='flex flex-row items-center space-between gap-3'>
          {[...Array(pages - 1).keys()].map((_, index) => {
            return index === page ? <CurrentPage key={index} /> : <PaginatorPage key={index} />
          })}
        </div>
      )}
      {(page !== 2)
        ? (
          <button
            className="btn-secondary-small border-none"
            onClick={next}
          >
            <span className="">Continue</span>
          </button>
        )
        : (
          <button
            className="btn-primary-small"
            title="accept"
            onClick={next}
          >Create Wallet
          </button>
        )}

    </div>
  )
}

const Title = (props: PropsWithChildren) => {
  return (
    <h1 className="font-title text-white leading-[3.25rem] text-title-l my-auto pb-10 flex">
      {props.children}
    </h1>
  )
}

const Paragraph = (props: PropsWithChildren<{ size?: string }>) => {
  return (
    <p className={`text-body-${props.size || 'm'} my-3 tracking-[0.01em] text-justify`}>
      {props.children}
    </p>
  )
}

const Page = (props: PropsWithChildren<{ page: number }>) => {
  return (
    <div
      className={`
        w-[100%] max-w-[833px] rounded-[5px]
        onboarding-${props.page} bg-[#3A3A3A59] bg-opacity-35 backdrop-blur-3xl
        px-16 pt-20 pb-10
      `}
    >
      {props.children}
    </div>
  )
}

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: FC<OnboardingProps> = ({ onFinish }) => {
  const [page, setPage] = useState(0)
  const pages = 3
  const next = () => setPage(page + 1)
  const prev = () => setPage(page - 1)

  return (
    <div className="onboarding">
      {page === 0 &&
        <Page page={page}>
          <Title>
            Join the Checker Network
          </Title>
          <div className='min-h-[200px]'>
            <Paragraph>
              Checker securely connects your computer to the global peer-to-peer Checker Network, which rewards
              you for your participation. Once you&apos;ve connected, you will begin completing checker jobs.
            </Paragraph>
          </div>
          <Footer page={page} pages={pages} next={next} prev={prev} />
        </Page>
      }

      {page === 1 &&
        <Page page={page}>
          <Title>Rewards</Title>
          <div className='min-h-[200px]'>
            <Paragraph>
              To get you set up, you will create a new Filecoin Wallet, controlled just by you.
              FIL will be transferred to your wallet according to your participation in the economy.
            </Paragraph>
          </div>
          <Footer page={page} pages={pages} next={next} prev={prev} />
        </Page>
      }

      {page === 2 &&
        <Page page={page}>
          <Title>Before we launch</Title>
          <div className='min-h-[200px]'>
            <Paragraph size='s'>
              Checker asks for your consent to use your personal data to store and/or access information on a
              device. Your personal data will be processed and information from your device (cookies, unique
              identifiers, and other device data) may be stored by, accessed by and shared with third party
              vendors, or used specifically by this app.
            </Paragraph>
            <Paragraph size='s'>
              By clicking {'"'}Create Wallet{'"'} or otherwise continuing to use this service, you agree, you
              have read, understand and accept Checker&apos;s
              {' '}
              <span
                className="text-primary cursor-pointer"
                onClick={showTermsOfService}
              >
                Terms of Service
              </span>.
            </Paragraph>
          </div>
          <Footer page={page} pages={pages} next={onFinish} prev={prev} />
        </Page>
      }

    </div>
  )
}

export default Onboarding
