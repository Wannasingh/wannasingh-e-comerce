// =============================================================================
// Jenkinsfile — Declarative Pipeline
// Stages: Checkout → Lint & Format Check → SonarQube Analysis →
//         Docker Build → Push to Registry
// =============================================================================

pipeline {
  agent {
    // Use a Docker-in-Docker capable agent or a node with Docker CLI
    label "docker"
  }

  // ── Environment & Credentials ──────────────────────────────────────────────
  environment {
    // Registry target — set this in Jenkins Global Properties or override per job
    REGISTRY         = "${env.REGISTRY ?: 'ghcr.io/wannasingh'}"
    IMAGE_FRONTEND   = "${REGISTRY}/frontend"
    IMAGE_BACKEND    = "${REGISTRY}/backend"

    // Image tag: prefer branch-specific tags, fall back to 'latest'
    IMAGE_TAG        = "${env.BRANCH_NAME?.replaceAll('[^a-zA-Z0-9._-]', '-') ?: 'latest'}-${env.BUILD_NUMBER}"

    // Jenkins credential IDs — configure these in Jenkins > Credentials
    DOCKER_CREDS     = credentials("docker-registry-creds")   // username/password credential
    SONAR_TOKEN      = credentials("sonarqube-token")          // secret text credential

    // Node.js / pnpm setup
    NODE_VERSION     = "20"
    PNPM_VERSION     = "9.15.0"
    PNPM_HOME        = "${WORKSPACE}/.pnpm"
    PATH             = "${PNPM_HOME}:${PATH}"
  }

  // ── Options ───────────────────────────────────────────────────────────────
  options {
    timeout(time: 45, unit: "MINUTES")
    buildDiscarder(logRotator(numToKeepStr: "10"))
    disableConcurrentBuilds(abortPrevious: true)
    ansiColor("xterm")
  }

  // ── Triggers ──────────────────────────────────────────────────────────────
  triggers {
    pollSCM("H/5 * * * *")  // Poll SCM every 5 minutes (replace with webhook)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  stages {

    // ── Stage 1: Checkout ──────────────────────────────────────────────────
    stage("Checkout") {
      steps {
        echo "🔁 Checking out source code..."
        checkout scm
        sh "git log --oneline -5"

        // Print environment info for debugging
        sh """
          echo "Node version: \$(node --version || echo 'not installed')"
          echo "Branch: ${env.BRANCH_NAME}"
          echo "Build: ${env.BUILD_NUMBER}"
          echo "Workspace: ${env.WORKSPACE}"
        """
      }
    }

    // ── Stage 2: Setup Dependencies ───────────────────────────────────────
    stage("Setup & Install") {
      steps {
        echo "📦 Installing pnpm and dependencies..."
        sh """
          corepack enable
          corepack prepare pnpm@${PNPM_VERSION} --activate
          pnpm --version
          pnpm install --frozen-lockfile
        """
      }
    }

    // ── Stage 3: Lint & Format Check ─────────────────────────────────────
    stage("Lint & Format Check") {
      parallel {
        stage("ESLint") {
          steps {
            echo "🔍 Running ESLint..."
            sh "pnpm lint"
          }
          post {
            failure {
              echo "❌ ESLint found errors. Fix them before merging."
            }
          }
        }
        stage("Prettier") {
          steps {
            echo "🎨 Checking Prettier formatting..."
            sh "pnpm format:check"
          }
          post {
            failure {
              echo "❌ Prettier formatting violations found. Run: pnpm format"
            }
          }
        }
        stage("TypeScript") {
          steps {
            echo "🔷 Running TypeScript type checks..."
            sh "pnpm type-check"
          }
        }
      }
    }

    // ── Stage 4: SonarQube Analysis ───────────────────────────────────────
    stage("SonarQube Analysis") {
      environment {
        // SONAR_HOST_URL can be set in Jenkins system config
        SONAR_HOST_URL = "${env.SONAR_HOST_URL ?: 'http://sonarqube:9000'}"
      }
      steps {
        echo "🔬 Running SonarQube analysis..."
        withSonarQubeEnv("SonarQube") {   // matches Jenkins SonarQube server config name
          sh """
            sonar-scanner \
              -Dsonar.login=${SONAR_TOKEN} \
              -Dsonar.host.url=${SONAR_HOST_URL} \
              -Dsonar.branch.name=${env.BRANCH_NAME ?: 'main'}
          """
        }
      }
      post {
        always {
          // Wait for SonarQube Quality Gate result (requires webhook configured in SonarQube)
          timeout(time: 5, unit: "MINUTES") {
            waitForQualityGate abortPipeline: true
          }
        }
      }
    }

    // ── Stage 5: Docker Build ─────────────────────────────────────────────
    stage("Docker Build") {
      parallel {
        stage("Build Frontend Image") {
          steps {
            echo "🐳 Building Astro frontend image..."
            sh """
              docker build \
                --file apps/frontend/Dockerfile \
                --target runner \
                --tag ${IMAGE_FRONTEND}:${IMAGE_TAG} \
                --tag ${IMAGE_FRONTEND}:latest \
                --build-arg PUBLIC_MEDUSA_BACKEND_URL=\${PUBLIC_MEDUSA_BACKEND_URL:-https://api.wannasingh.com} \
                --build-arg PUBLIC_SITE_URL=\${PUBLIC_SITE_URL:-https://wannasingh.com} \
                --cache-from ${IMAGE_FRONTEND}:latest \
                --label "org.opencontainers.image.source=\$(git remote get-url origin)" \
                --label "org.opencontainers.image.revision=\$(git rev-parse HEAD)" \
                --label "org.opencontainers.image.created=\$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                .
            """
          }
        }
        stage("Build Backend Image") {
          steps {
            echo "🐳 Building MedusaJS backend image..."
            sh """
              docker build \
                --file apps/backend/Dockerfile \
                --target runner \
                --tag ${IMAGE_BACKEND}:${IMAGE_TAG} \
                --tag ${IMAGE_BACKEND}:latest \
                --cache-from ${IMAGE_BACKEND}:latest \
                --label "org.opencontainers.image.source=\$(git remote get-url origin)" \
                --label "org.opencontainers.image.revision=\$(git rev-parse HEAD)" \
                --label "org.opencontainers.image.created=\$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                .
            """
          }
        }
      }
    }

    // ── Stage 6: Push to Registry ─────────────────────────────────────────
    stage("Push to Registry") {
      when {
        // Only push on main/master or release branches
        anyOf {
          branch "main"
          branch "master"
          branch pattern: "release/.*", comparator: "REGEXP"
        }
      }
      steps {
        echo "🚀 Pushing images to registry: ${REGISTRY}"
        sh "echo ${DOCKER_CREDS_PSW} | docker login ${REGISTRY} --username ${DOCKER_CREDS_USR} --password-stdin"
        sh """
          docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}
          docker push ${IMAGE_FRONTEND}:latest
          docker push ${IMAGE_BACKEND}:${IMAGE_TAG}
          docker push ${IMAGE_BACKEND}:latest
        """
        echo "✅ Images pushed:"
        echo "   ${IMAGE_FRONTEND}:${IMAGE_TAG}"
        echo "   ${IMAGE_BACKEND}:${IMAGE_TAG}"
      }
      post {
        always {
          // Always logout after push
          sh "docker logout ${REGISTRY}"
        }
      }
    }

  }  // end stages

  // ── Post Actions ──────────────────────────────────────────────────────────
  post {
    always {
      echo "🧹 Cleaning up dangling Docker images..."
      sh "docker image prune -f || true"
    }
    success {
      echo "✅ Pipeline completed successfully!"
      // Add Slack/Teams notification here if needed
    }
    failure {
      echo "❌ Pipeline failed. Check logs above."
      // Add Slack/Teams failure notification here
    }
    unstable {
      echo "⚠️ Pipeline unstable (test failures or quality gate warning)."
    }
  }
}
