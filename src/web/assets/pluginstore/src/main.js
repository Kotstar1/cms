/* global Craft */
/* global Garnish */
/* global $ */

import Vue from 'vue'
import axios from 'axios'
import {currency} from './js/filters/currency'
import {escapeHtml, formatDate, formatNumber, t} from './js/filters/craft'
import router from './js/router'
import store from './js/store'
import {mapState} from 'vuex'
import Modal from './js/components/modal/Modal'
import StatusMessage from './js/components/StatusMessage'
import App from './App'
import './js/plugins/craftui'
import './js/plugins/vue-awesome-swiper'

Vue.filter('currency', currency)
Vue.filter('escapeHtml', escapeHtml)
Vue.filter('formatDate', formatDate)
Vue.filter('formatNumber', formatNumber)
Vue.filter('t', t)

Garnish.$doc.ready(function() {
    Craft.initUiElements()

    window.pluginStoreApp = new Vue({
        router,
        store,
        render: h => h(App),

        components: {
            Modal,
            StatusMessage,
            App,
        },

        data() {
            return {
                pageTitle: 'Plugin Store',
                plugin: null,
                pluginId: null,
                modalStep: null,
                coreDataLoaded: false,
                pluginStoreDataError: false,
                craftDataLoaded: false,
                pluginLicenseInfoLoaded: false,
                cartDataLoaded: false,
                allDataLoaded: false,
                showModal: false,
                statusMessage: null,
            }
        },

        computed: {
            ...mapState({
                cart: state => state.cart.cart,
                craftId: state => state.craft.craftId,
            }),

            pluginStoreDataLoaded() {
                return this.coreDataLoaded && this.pluginLicenseInfoLoaded
            },
        },

        watch: {
            cart(cart) {
                this.$emit('cartChange', cart)
            },

            craftId() {
                this.$emit('craftIdChange')
            }
        },

        methods: {
            displayNotice(message) {
                Craft.cp.displayNotice(message)
            },

            displayError(message) {
                Craft.cp.displayError(message)
            },

            showPlugin(plugin) {
                this.plugin = plugin
                this.pluginId = plugin.id
                this.openModal('plugin-details')
            },

            openModal(modalStep) {
                this.modalStep = modalStep

                this.showModal = true
            },

            closeModal() {
                this.showModal = false
            },

            updateCraftId(craftIdJson) {
                const craftId = JSON.parse(craftIdJson)
                this.$store.commit('craft/updateCraftId', craftId)
                this.$store.commit('craft')
                this.$emit('craftIdUpdated')
            },

            /**
             * Initializes components that live outside of the Vue app.
             */
            initializeOuterComponents() {
                // Header Title
                const $headerTitle = $('#header h1')

                $headerTitle.on('click', function() {
                    this.$router.push({path: '/'})
                }.bind(this))

                // Cart button
                const $cartButton = $('#cart-button')

                $cartButton.on('click', function(e) {
                    e.preventDefault()
                    this.openModal('cart')
                }.bind(this))

                $cartButton.keydown(function(e) {
                    switch (e.which) {
                        case 13: // Enter
                        case 32: // Space
                            e.preventDefault()
                            this.openModal('cart')
                            break

                    }
                }.bind(this))

                this.$on('cartChange', function (cart) {
                    let totalQty = 0

                    if (cart) {
                        totalQty = cart.totalQty
                    }

                    $('.badge', $cartButton).html(totalQty)
                })

                // Plugin Store actions
                const $pluginStoreActions = $('#pluginstore-actions')
                const $pluginStoreActionsSpinner = $('#pluginstore-actions-spinner')

                // Show actions spinner when Plugin Store data has finished loading but Craft data has not.
                this.$on('dataLoaded', function() {
                    if (this.pluginStoreDataLoaded && !(this.craftDataLoaded && this.cartDataLoaded)) {
                        $pluginStoreActionsSpinner.removeClass('hidden')
                    }
                }.bind(this))

                // Hide actions spinner when Plugin Store data and Craft data have finished loading.
                this.$on('allDataLoaded', function() {
                    $pluginStoreActions.removeClass('hidden')
                    $pluginStoreActionsSpinner.addClass('hidden')
                })

                // Craft ID
                const $craftId = $('#craftid-account')
                const $craftIdConnectForm = $('#craftid-connect-form')
                const $craftIdDisconnectForm = $('#craftid-disconnect-form')

                this.$on('craftIdChange', function() {
                    if (this.craftId) {
                        $('.label', $craftId).html(this.craftId.username)

                        $craftId.removeClass('hidden')
                        $craftIdConnectForm.addClass('hidden')
                        $craftIdDisconnectForm.removeClass('hidden')
                    } else {
                        $craftId.addClass('hidden')
                        $craftIdConnectForm.removeClass('hidden')
                        $craftIdDisconnectForm.addClass('hidden')
                    }
                })

                // Cancel ajax requests when an outbound link gets clicked
                $('a[href]').on('click', function() {
                    this.$store.dispatch('craft/cancelRequests')
                    this.$store.dispatch('pluginStore/cancelRequests')
                }.bind(this))
            },

            loadCartData() {
                this.$store.dispatch('cart/getCart')
                    .then(() => {
                        this.cartDataLoaded = true
                        this.$emit('dataLoaded')
                    })
            },

            loadCraftData() {
                this.$store.dispatch('craft/getCraftData')
                    .then(() => {
                        this.craftDataLoaded = true
                        this.$emit('dataLoaded')
                    })
                    .catch(() => {
                        this.craftDataLoaded = true
                    })
            },

            loadData() {
                this.loadPluginStoreData()
                this.loadCraftData()
                this.loadCartData()
            },

            loadPluginStoreData() {
                // core data
                this.$store.dispatch('pluginStore/getCoreData')
                    .then(() => {
                        this.coreDataLoaded = true
                        this.$emit('dataLoaded')
                    })
                    .catch((error) => {
                        if (axios.isCancel(error)) {
                            // Request canceled
                        } else {
                            this.pluginStoreDataError = true
                            this.statusMessage = this.$options.filters.t('The Plugin Store is not available, please try again later.', 'app')
                        }
                    })

                // plugin license info
                this.$store.dispatch('craft/getPluginLicenseInfo')
                    .then(() => {
                        this.pluginLicenseInfoLoaded = true
                        this.$emit('dataLoaded')
                    })
                    .catch((error) => {
                        if (axios.isCancel(error)) {
                            // Request canceled
                        } else {
                            throw error
                        }
                    })
            },

            onDataLoaded() {
                if (!this.pluginStoreDataLoaded) {
                    return null
                }

                if (!this.craftDataLoaded) {
                    return null
                }

                if (!this.cartDataLoaded) {
                    return null
                }

                this.allDataLoaded = true
                this.$emit('allDataLoaded')
            },
        },

        created() {
            // Page Title
            this.pageTitle = this.$options.filters.t("Plugin Store", 'app')

            // Status message
            this.statusMessage = this.$options.filters.t("Loading Plugin Store…", 'app')

            // Initialize outer components
            this.initializeOuterComponents()

            // On data loaded
            this.$on('dataLoaded', this.onDataLoaded)

            // Load data
            this.loadData()
        },
    }).$mount('#app')
})
