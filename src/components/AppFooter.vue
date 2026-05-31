<template>
  <footer class="app-footer">
    <div class="inner">
      <p class="attribution">
        {{ t('footer.madeBy') }}
        <a href="https://github.com/hartman" target="_blank" rel="noopener">Derk-Jan Hartman</a><a class="gh-icon" href="https://github.com/hartman" target="_blank" rel="noopener" aria-label="Derk-Jan Hartman on GitHub"><svg aria-hidden="true"><use href="/icons.svg#github-logo-icon" /></svg></a><br>
        {{ t('footer.originallyBy') }} <a href="https://raquelmsmith.com/?utm_source=zonestamp&utm_medium=footer" target="_blank" rel="noopener">Raquel M. Smith</a><a class="gh-icon" href="https://github.com/raquelmsmith" target="_blank" rel="noopener" aria-label="Raquel M. Smith on GitHub"><svg aria-hidden="true"><use href="/icons.svg#github-logo-icon" /></svg></a>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.app-footer {
  padding: 0.75rem 0;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  font-size: 0.875rem;
  border-top: 1px solid var(--white-alpha-20);
}

.inner {
  padding: 0 max(1rem, env(safe-area-inset-right));
  padding-left: max(1rem, env(safe-area-inset-left));
}

.attribution {
  margin: 0;
  line-height: 1.8;
  color: var(--muted-white-color);
}

.attribution a:not(.gh-icon),
.attribution :deep(a:not(.gh-icon)) {
  color: var(--primary-link-color);
  text-decoration: underline;
}

.gh-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 4px;
  color: var(--muted-white-color);
  opacity: 0.7;
  transition: opacity 0.15s;
}

.gh-icon:hover {
  opacity: 1;
}

.gh-icon svg {
  width: 14px;
  height: 14px;
}
</style>
