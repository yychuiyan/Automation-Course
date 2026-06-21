pipeline {
  agent any
  tools { nodejs 'Node20' }

  // 定时触发：工作日早 9 点
  // triggers { cron('H 9 * * 1-5') }

  environment {
    BASE_URL        = credentials('testing-base-url')
    ADMIN_USERNAME  = credentials('testing-admin-username')
    ADMIN_PASSWORD  = credentials('testing-admin-password')
    USER_USERNAME   = credentials('testing-user-username')
    USER_PASSWORD   = credentials('testing-user-password')
  }

  stages {
    stage('安装依赖') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install chromium --with-deps'
      }
    }

    stage('冒烟测试') {
      steps {
        sh 'npm run test:smoke'
      }
      post {
        failure {
          echo '冒烟测试未通过，阻塞后续阶段'
        }
      }
    }

    stage('回归测试') {
      steps {
        sh 'npm run test:regression'
      }
    }

    stage('生成报告') {
      steps {
        sh 'npx playwright show-report reports/playwright-report'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/playwright-report/**', allowEmptyArchive: true
      publishHTML(target: [
        reportName: 'Playwright Report',
        reportDir: 'reports/playwright-report',
        reportFiles: 'index.html',
      ])
    }
    failure {
      echo '测试失败，请检查 Jenkins 控制台日志'
    }
  }
}
