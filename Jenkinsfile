pipeline {
    agent any

    // 环境变量：从 Jenkins 凭证注入敏感信息，其余直接给默认值
    environment {
        // ---- 被测环境 ----
        BASE_URL = credentials('TEST_BASE_URL')

        // ---- 管理员账号 ----
        ADMIN_USERNAME = credentials('TEST_ADMIN_USERNAME')
        ADMIN_PASSWORD = credentials('TEST_ADMIN_PASSWORD')

        // ---- 普通用户账号 ----
        USER_USERNAME = credentials('TEST_USER_USERNAME')
        USER_PASSWORD = credentials('TEST_USER_PASSWORD')

        // ---- CI 标记（playwright.config.ts 里 process.env.CI 判断） ----
        CI = 'true'
    }

    parameters {
        choice(
            name: 'TEST_LEVEL',
            choices: ['smoke', 'regression', 'full'],
            description: 'smoke=P0冒烟(2min) | regression=P0+P1回归(5min) | full=全量(8min)'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
        }

        stage('Install Playwright Browser') {
            steps {
                sh 'npx playwright install chromium'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    switch (params.TEST_LEVEL) {
                        case 'smoke':
                            sh 'npm run test:smoke'
                            break
                        case 'regression':
                            sh 'npm run test:regression'
                            break
                        case 'full':
                            sh 'npm test'
                            break
                    }
                }
            }
        }
    }

    post {
        always {
            // 归档测试产物
            archiveArtifacts artifacts: 'test-results/**, reports/**', allowEmptyArchive: true

            // 发布 HTML 报告（需要 HTML Publisher 插件）
            publishHTML(
                target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports/playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Test Report'
                ]
            )
        }

        failure {
            echo "测试失败！查看报告: ${env.BUILD_URL}"
        }
    }
}
