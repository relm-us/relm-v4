<script>
  import DefaultScreen from '../DefaultScreen'
  import ContinueButton from '../../ContinueButton'
  import PersonalizeAvatar from '/personalization/PersonalizeAvatar.svelte'

  import {
    avatarGender,
    avatarVariant,
    avatarSkintoneId,
  } from '/svelte/SettingsStore.js'

  let transientAvatarGender = null
  let transientAvatarVariant = null
  let transientAvatarSkintoneId = null

  let canContinue = false

  function handleChange(gender, variant, skintoneId) {
    transientAvatarGender = gender
    transientAvatarVariant = variant
    transientAvatarSkintoneId = skintoneId
  }

  function handleContinue() {
    $avatarGender = transientAvatarGender
    $avatarVariant = transientAvatarVariant
    $avatarSkintoneId = transientAvatarSkintoneId
  }

  $: canContinue =
    transientAvatarGender !== null &&
    transientAvatarVariant !== null &&
    transientAvatarSkintoneId !== null
</script>

<DefaultScreen>
  <PersonalizeAvatar
    gender={transientAvatarGender}
    variant={transientAvatarVariant}
    skintoneId={transientAvatarSkintoneId}
    onChange={handleChange} />
  <ContinueButton on:click={handleContinue} enabled={canContinue} />
</DefaultScreen>
