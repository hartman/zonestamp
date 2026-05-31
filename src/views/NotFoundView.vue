<template>
  <AppLayout>
    <p>{{ t('notFound.message') }}</p>
    <RouterLink to="/">{{ t('notFound.makeNew') }}</RouterLink>
  </AppLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'

const { t } = useI18n()
</script>
