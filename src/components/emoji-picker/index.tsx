import styled from 'styled-components'
import type { IEmojiPickerProps } from 'emoji-picker-react'
import EmojiPicker from 'emoji-picker-react'

const EmojiPickerWrapper = styled.div`
  width: 100%;
  height: 100%;

  &,
  & * {
    border-color: inherit !important;
    background: inherit;
  }

  & .emoji-picker-react {
    width: 100%;
    height: 100%;

    border: none;
    background: inherit;
    box-shadow: unset;

    & .emoji-search {
      margin-left: 0.9375rem;
      padding: 0.625rem;
      width: calc(100% - 2 * 0.9375rem);
      color: black;

      &:focus {
        outline: auto;
      }
    }

    & .skin-tones-list {
      top: 50%;
      right: 2.5rem;
      transform: translateY(-50%);
      width: 0.625rem;
      height: 0.625rem;
      max-width: 15px;
      max-height: 15px;

      & > li {
        &,
        & > label {
          width: 100%;
          height: 100%;
        }
      }
    }

    & .emoji-categories {
      padding: 0 0.9375rem;

      & button {
        height: 2.5rem;
        width: 1.25rem;
        background-size: unset;

        &:focus {
          opacity: 0.7;
        }
        &.active {
          opacity: 1;
        }
      }
    }

    & .content-wrapper::before {
      right: 1.25rem;
      color: unset;
      font-size: 0.687rem;
      line-height: 2.8125rem;
      max-height: 2.8125rem;
    }

    & > div:nth-child(3) {
      z-index: 2;
    }

    & .emoji-scroll-wrapper {
      & button > div {
        margin: 0.3125rem;
        height: 1.5645rem;
        width: 1.5625rem;
        font-size: 1.5625rem;
      }

      & .emoji-group {
        padding: 0 0.9375rem;

        &::before {
          color: unset;
          background: inherit;
          opacity: 0.95;
          font-size: 0.875rem;
          line-height: 2.8125rem;
        }
      }
    }
  }
`

export default function StyledEmojiPicker({
  emojiUrl,
  onEmojiClick,
  preload,
  native,
  skinTone,
  disableAutoFocus,
  disableSearchBar,
  disableSkinTonePicker,
  groupNames,
  pickerStyle,
  groupVisibility,
  ...restProps
}: IEmojiPickerProps): JSX.Element {
  const emojiPickerProps = {
    emojiUrl,
    onEmojiClick,
    preload,
    native,
    skinTone,
    disableAutoFocus,
    disableSearchBar,
    disableSkinTonePicker,
    groupNames,
    pickerStyle,
    groupVisibility
  }

  return (
    <div {...restProps}>
      <EmojiPickerWrapper>
        <EmojiPicker {...emojiPickerProps} />
      </EmojiPickerWrapper>
    </div>
  )
}

export * from 'emoji-picker-react'
