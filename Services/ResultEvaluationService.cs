public class ResultEvaluationService
{
    public string GetEvaluation(string category, double average)
    {
        return category switch
        {
            "AI APPLICATION" => GetAIApplicationEvaluation(average),
            "PEOPLE & ORGANIZATION" => GetPeopleOrgEvaluation(average),
            "TECH & DATA" => GetTechDataEvaluation(average),
            _ => "Category evaluation not available."
        };
    }

    private string GetAIApplicationEvaluation(double average)
    {
        if (average <= 1.0)
            return "Your organization has not yet embraced AI as a strategic enabler. Without a clear AI vision, you risk missing out on major efficiencies, innovation potential, and new revenue streams. AI is rapidly reshaping industries, and companies that fail to act now will struggle to compete in the near future. We recommend launching structured AI discovery initiatives to identify high-impact opportunities and quick-win use cases.";
        if (average <= 1.5)
            return "AI is recognized as a potential value driver within your company, but its implementation remains sporadic. Early-stage AI pilots may exist, but they are not systematically scaled across business units. To accelerate maturity, leadership alignment and a structured AI adoption roadmap are essential. Your next step should be defining clear objectives for AI integration in core products, services, and operational processes.";
        if (average <= 2.0)
            return "Your company has made initial strides in AI, applying it to select products or processes. However, AI usage remains opportunistic rather than strategic, and there is no clear path toward organization-wide adoption. To progress, a unified AI strategy must be established, ensuring AI is embedded into key business functions with measurable business impact.";
        if (average <= 2.5)
            return "Your organization has started leveraging AI across multiple areas, from process automation to customer-facing solutions. However, gaps remain in aligning AI initiatives with broader business goals. To unlock AI’s full potential, leadership must prioritize AI-driven business model innovation and operational efficiency, ensuring AI is integrated across the entire value chain.";
        if (average <= 3.0)
            return "AI is actively contributing to business performance, yet its full transformative potential remains untapped. Your organization benefits from AI-driven efficiencies, but opportunities exist to move beyond automation and toward AI-powered business models. Investing in AI-first innovation, such as AI-driven customer experiences and intelligent decision-making, will differentiate you from competitors.";
        if (average <= 3.5)
            return "Your company has successfully embedded AI into multiple business areas, driving both efficiency and revenue. However, AI adoption may still be function-specific rather than holistic. To progress, focus on scaling AI across all departments, ensuring AI is integrated into strategic decision-making, customer interactions, and operational excellence.";
        if (average <= 4.0)
            return "AI is well-integrated within your company, significantly contributing to performance, decision-making, and business expansion. Your next priority should be developing AI-native offerings and services that differentiate you in the market. Leading companies at this stage are also investing in AI-powered personalization, predictive analytics, and automated decision-making at scale.";
        if (average <= 4.5)
            return "You are among the top AI adopters, leveraging AI not only for operational efficiency but also for strategic growth. AI is driving revenue through new business models and value-added services. The next challenge is staying ahead—continuously exploring generative AI, real-time AI applications, and AI-first customer experiences to sustain your competitive advantage.";
        return "You are among the few organizations that have fully integrated AI into every aspect of business operations and innovation. AI is at the heart of your strategy, continuously improving decision-making, automation, and customer engagement. Your role now is to push the boundaries—exploring advanced AI governance, contributing to AI policy discussions, and leading AI-driven industry transformation.";
    }

    private string GetPeopleOrgEvaluation(double average)
    {
    if (average <= 1.0)
        return "Your organization currently lacks a structured approach to AI governance, talent development, and mindset. Without clear ownership of AI initiatives, decision-making is fragmented, and AI adoption is inconsistent or absent. This creates significant risks in terms of inefficient investments and missed opportunities for business growth. To progress, leadership must take responsibility for defining AI policies, governance structures, and skills development programs.";
    if (average <= 1.5)
        return "Your organization acknowledges AI's importance, but efforts remain decentralized and uncoordinated. While there may be discussions about AI's potential, no structured decision-making processes or guidelines exist to drive responsible AI development. Additionally, talent strategies are either underdeveloped or nonexistent, leaving employees without the skills necessary to leverage AI effectively. To move forward, leadership must formalize AI governance and create clear AI training and recruitment plans.";
    if (average <= 2.0)
        return "Some AI initiatives exist within your company, but they are not yet tied to a larger strategic framework. Governance structures and decision-making processes are either ad-hoc or in their infancy. While there may be individuals championing AI, their efforts lack formal backing from leadership. Moreover, AI talent acquisition and upskilling efforts are sporadic rather than strategic. Your next step should be establishing a centralized AI steering committee and embedding AI talent management into broader workforce planning.";
    if (average <= 2.5)
        return "Your organization has started developing AI governance and talent strategies, but they are not yet fully embedded across all departments. While some training and hiring efforts are in place, they do not yet ensure that employees across all levels can effectively use or contribute to AI initiatives. To progress, focus on strengthening AI governance frameworks and embedding AI training into company-wide learning and development programs.";
    if (average <= 3.0)
        return "Your organization has established AI governance structures, decision-making guidelines, and a growing talent strategy. AI is becoming a key part of leadership discussions, and policies for responsible AI use are being developed. However, these structures may still be limited in scope, with varying levels of adoption across business units. The next step is to integrate AI-driven decision-making into broader corporate strategy and ensure leadership alignment on AI initiatives.";
    if (average <= 3.5)
        return "Your organization has clear AI governance, defined decision-making frameworks, and a structured talent strategy. Leaders actively drive AI adoption, and employees across various functions are developing AI-related skills. However, while AI is being systematically integrated into operations, full organizational alignment is still a work in progress. Focus on further embedding AI-first thinking into leadership and accelerating AI training to empower employees beyond technical teams.";
    if (average <= 4.0)
        return "AI governance and decision-making processes are well-established, and leadership actively steers AI strategy with a long-term vision. Your company invests in AI-specific talent development programs, ensuring employees across functions have the skills needed to integrate AI into daily operations. However, AI-driven cultural transformation is still evolving, and some employees may still view AI as a tool rather than a mindset shift.";
    if (average <= 4.5)
        return "Your organization is structured for AI success, with strong governance, embedded AI leadership, and a future-focused talent strategy. Employees at all levels understand how to work with AI, and AI capabilities are being continuously enhanced through structured learning and recruitment efforts. AI-driven decision-making is not just encouraged but expected. To maintain your competitive edge, ensure that your AI leadership stays ahead of industry trends and refine ethical AI guidelines.";
    return "Your organization has achieved full AI maturity, with AI seamlessly embedded in leadership decision-making, workforce development, and business operations. AI is no longer viewed as a separate initiative but as a fundamental part of how your company operates and innovates. Employees at all levels—from executives to frontline teams—understand how to leverage AI in their roles. The focus should now be on leading AI best practices externally, influencing industry standards, and continuously refining your AI-driven organizational culture.";
    }

    private string GetTechDataEvaluation(double average)
    {
        if (average <= 1.0)
            return "Your organization currently lacks the necessary tools, infrastructure, and data strategies to support AI adoption. This foundational gap significantly limits your ability to implement AI solutions effectively. Without robust security, a coherent data strategy, and scalable AI tools, your organization risks falling behind competitors who are leveraging AI-ready systems. Immediate priorities include investing in secure and scalable infrastructure, improving data quality, and establishing governance models to support AI development and deployment.";
        if (average <= 1.5)
            return "Your organization has started experimenting with AI technologies, but the tools and data strategies in place are fragmented and inconsistent. AI systems operate in silos, making it challenging to achieve meaningful results or scale solutions effectively. Security and privacy measures may also be insufficient, introducing potential risks. To progress, you must consolidate AI tools into a unified ecosystem, develop a cohesive data strategy, and ensure strong data governance to build trust and reliability in AI deployments.";
        if (average <= 2.0)
            return "Your organization has taken initial steps toward implementing AI infrastructure, such as deploying some tools or creating basic data pipelines. However, these efforts lack full integration, and your AI systems are not yet aligned with business needs. Security and privacy protections may also be underdeveloped. To advance, focus on integrating your AI tools into a coherent ecosystem, establishing strong privacy protocols, and aligning your infrastructure investments with specific AI use cases to maximize business impact.";
        if (average <= 2.5)
            return "Your organization has developed an emerging AI technology stack, but gaps in data management, privacy, or security remain. While you are able to deploy AI applications, scalability and reliability are hindered by issues such as inconsistent data quality or incomplete integration of tools. To progress, prioritize addressing data strategy shortcomings, improving interoperability between AI tools, and enhancing security measures to safeguard sensitive information. Establishing clear accountability for AI and data governance will also be key.";
        if (average <= 3.0)
            return "Your organization has a solid foundation of AI tools and infrastructure in place. AI is being actively deployed across select use cases, supported by a structured data strategy. However, there may still be inefficiencies in scaling AI across departments or integrating AI solutions into business processes. Security and data governance practices are functional but not yet fully optimized. The next step is to refine your AI ecosystem, ensure seamless integration across business units, and strengthen security protocols to support future growth.";
        if (average <= 3.5)
            return "Your AI infrastructure is maturing, with tools, systems, and data strategies aligned to support scalable AI adoption. You are leveraging AI for multiple use cases, and security and privacy considerations are embedded into your processes. However, further refinement is needed in areas such as real-time data processing, advanced analytics, or automation of data pipelines. To progress, focus on enhancing the agility of your AI stack, improving automation, and optimizing your data strategy for predictive and real-time AI applications.";
        if (average <= 4.0)
            return "Your organization has established a highly functional AI ecosystem, with integrated tools, scalable infrastructure, and strong data governance. AI applications are operating seamlessly across functions, driving both operational efficiency and innovation. Security and privacy protections are robust, minimizing risks associated with AI deployment. The next frontier is to implement cutting-edge AI capabilities such as generative models, advanced automation, or edge AI solutions. Further enhancing real-time data analytics will position your organization as an industry leader.";
        if (average <= 4.5)
            return "Your organization has built an AI-optimized enterprise architecture, where AI is seamlessly integrated into business processes and powered by a scalable, secure, and efficient technology stack. Data flows are automated, and real-time insights are leveraged for decision-making. Your robust data governance ensures both compliance and trust. At this stage, your focus should be on driving further innovation through advanced AI technologies, creating AI-native products and services, and exploring opportunities for energy-efficient AI solutions to remain competitive.";
        return "Your organization operates on an AI-first infrastructure, where AI tools and data management systems work in perfect harmony to drive real-time decision-making and business innovation. Security and privacy protections are cutting-edge, ensuring that AI adoption is both compliant and ethical. You are positioned at the forefront of AI-driven industries, leveraging scalable infrastructure and advanced analytics to consistently outperform competitors. Your next focus should be on influencing industry standards, experimenting with next-generation AI models, and continuously improving the sustainability of your AI operations to stay ahead of the curve.";
    }
}