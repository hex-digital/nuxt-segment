<template>
  <div>
    <NuxtLink :to="{ name: 'two' }" >Go forward</NuxtLink>
    <button @click="testIdentity">Test identity</button>
    <button @click="resetIdentity">Test reset identity</button>
  </div>
</template>

<script lang="ts" setup>
import { useSegment } from '#imports';

const segment = useSegment();

function testIdentity() {
  segment.identify('123');
}
function resetIdentity() {
  segment.reset();
}
</script>
