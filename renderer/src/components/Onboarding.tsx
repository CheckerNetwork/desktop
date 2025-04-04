import { FC, useState, PropsWithChildren } from 'react'
import Back from 'src/assets/img/icons/arrow-left.svg?react'
import Page from 'src/assets/img/icons/paginator-page.svg?react'
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
        className="btn-secondary-small flex items-center group back-button border-none"
        disabled={page === 0}
        onClick={prev}
        type="button"
      >
        <i><Back className="btn-icon-primary-small" fill={page === 0 ? '#b3b3b3' : '#4a7dff'} /></i>
        <span>Back</span>
      </button>
      <div className='flex flex-row items-center space-between gap-3'>
        {[...Array(pages - 1).keys()].map((_, index) => {
          return index === page ? <CurrentPage key={index} /> : <Page key={index} />
        })}
      </div>
      <button
        className="btn-secondary-small border-none"
        onClick={next}
      >
        <span className="">Continue</span>
      </button>
    </div>
  )
}

const Title = (props: PropsWithChildren) => {
  return (
    <h1 className="font-title text-white leading-[3.25rem] text-title-l my-auto">
      {props.children}
    </h1>
  )
}

const Paragraph = (props: PropsWithChildren) => {
  return (
    <p className="text-body-m my-3 tracking-[0.01em]">
      {props.children}
    </p>
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
        <div
          className={`
            w-[100%] max-w-[640px] bg-white rounded-[10px] shadow-[0px_5px_25px_rgba(0,0,0,0.1)] onboarding-${page}
          `}
        >
          <div className='bg-black px-20 py-16  rounded-t-[10px] min-h-[276px] flex'>
            <Title>
              Join the Checker Network.
            </Title>
          </div>
          <div className='min-h-[372px]'>
            <div className='pb-20 px-20 pt-16 min-h-[250px]'>
              <Paragraph>
                Checker securely connects your computer to the global peer-to-peer Checker Network, which rewards
                you for your participation. Once you&apos;ve connected, you will begin completing checker jobs.
              </Paragraph>
            </div>
            <div className='pb-20 bottom-0 px-20'>
              <Footer page={page} pages={pages} next={next} prev={prev} />
            </div>
          </div>
        </div>
      }

      {page === 1 &&
        <div
          className={`
            w-[100%] max-w-[640px] bg-white rounded-[10px] shadow-[0px_5px_25px_rgba(0,0,0,0.1)] onboarding-${page}
          `}
        >
          <div className='bg-black px-20 py-16  rounded-t-[10px] min-h-[276px] flex'>
            <Title>Rewards</Title>
          </div>
          <div className='min-h-[372px]'>
            <div className='pb-20 px-20 pt-16 min-h-[250px]'>
              <Paragraph>
                To get you set up, you will create a new Filecoin Wallet, controlled just by you.
              </Paragraph>
              <Paragraph>
                FIL will be transferred to your wallet according to your participation in the economy.
              </Paragraph>
            </div>
            <div className='pb-20 bottom-0 px-20'>
              <Footer page={page} pages={pages} next={next} prev={prev} />
            </div>
          </div>
        </div>
      }

      {page === 2 &&
        <div
          className={`
            w-[100%] max-w-[940px] bg-white rounded-[10px] shadow-[0px_5px_25px_rgba(0,0,0,0.1)] onboarding-${page}
          `}
        >
          <div className='bg-black px-20 py-16  rounded-t-[10px] min-h-[276px] flex'>
            <Title>Before we launch.</Title>
          </div>
          <div className='min-h-[372px]'>
            <div className='pb-8 px-20 pt-8 min-h-[250px]'>
              <Paragraph>
                Checker asks for your consent to use your personal data to store and/or access information on a
                device. Your personal data will be processed and information from your device (cookies, unique
                identifiers, and other device data) may be stored by, accessed by and shared with third party
                vendors, or used specifically by this app.
              </Paragraph>
              <Paragraph>
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
            <div className='pb-20 bottom-0 px-20'>
              <div className="flex flex-row gap-3 justify-between">
                <button
                  className="btn-secondary-small flex items-center group border-none underline underline-offset-4"
                  title="previous"
                  onClick={prev}
                >
                  <i><Back className="btn-icon-primary-small" fill='#4a7dff' /></i>
                  <span>Back</span>
                </button>
                <button
                  className="btn-primary-small"
                  title="accept"
                  onClick={() => { onFinish() }}
                >Create Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  )
}

export default Onboarding
