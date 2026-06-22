pipeline {
    // Docker 容器内运行：Node + Playwright + Chromium 全内置，环境零依赖
    agent {
        docker { image 'playwright-runner:latest' }
    }

    environment {
        BASE_URL           = credentials('TEST_BASE_URL')
        ADMIN_USERNAME     = credentials('TEST_ADMIN_USERNAME')
        ADMIN_PASSWORD     = credentials('TEST_ADMIN_PASSWORD')
        USER_USERNAME      = credentials('TEST_USER_USERNAME')
        USER_PASSWORD      = credentials('TEST_USER_PASSWORD')
        PLAYWRIGHT_BROWSERS_PATH = '/opt/playwright-browsers'
        CI                      = 'true'
    }

    parameters {
        choice(
            name: 'TEST_LEVEL',
            choices: ['smoke', 'regression', 'edge', 'full'],
            description: 'smoke=P0冒烟(2min) | regression=P0+P1回归(5min) | edge=P2边界(1min) | full=全量(8min)'
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
                sh 'npm ci'
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
                        case 'edge':
                            sh 'npm run test:edge'
                            break
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'npx allure generate reports/allure-results -o reports/allure-report --clean'
            archiveArtifacts artifacts: 'test-results/**, reports/**', allowEmptyArchive: true
            allure includeProperties: false, results: [[path: 'reports/allure-results']]
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
